import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/load-typescript.mjs';

const core = load('src/lib/campaignReminder.ts');
const guide = load('src/lib/campaignEmailContent.ts');

function fixture(options = {}) {
  const db = {
    campaign_reminder_deliveries: options.jobs || [{ id: 1, application_id: 10, source: 'AUTOMATIC', due_at: '2020-01-01', status: 'PENDING' }],
    applications: options.applications || [{ id: 10, user_id: 'reviewer', campaign_id: 44, status: 'SELECTED', review_submitted: false, review_deadline: null }],
    profiles: options.profiles || [{ id: 'reviewer', email: 'reviewer@example.test', nickname: '테스트' }],
    campaigns: [{ id: 44, title: '실제 캠페인', status: 'ONGOING', campaign_options: { step2Data: { missionGuide: '가이드', purchaseNotes: '주의사항' } } }],
    reviews: options.reviews || [], sends: [], reads: 0,
  };
  db.from = (table) => {
    let operation = 'select', patch, settings = {}, rowLimit = Infinity;
    const filters = [];
    const query = {
      select(_columns, config) { settings = config || {}; return query; },
      eq(k, v) { filters.push(r => r[k] === v); return query; },
      in(k, values) { filters.push(r => values.includes(r[k])); return query; },
      lt(k, v) { filters.push(r => r[k] != null && r[k] < v); return query; },
      lte(k, v) { filters.push(r => r[k] != null && r[k] <= v); return query; },
      limit(v) { rowLimit = v; return query; },
      order() { return query; },
      update(v) { operation = 'update'; patch = v; return query; },
      upsert(v) { operation = 'upsert'; patch = v; return query; },
      async maybeSingle() { const r = execute(); return { ...r, data: r.data?.[0] || null }; },
      async single() { const r = execute(); return { ...r, data: r.data?.[0] || null }; },
      then(resolve, reject) { return Promise.resolve().then(execute).then(resolve, reject); },
    };
    function execute() {
      if (table === 'applications' && operation === 'select') {
        db.reads++;
        if (options.completeDuringLookup && db.reads === 2) db.applications[0].review_submitted = true;
      }
      if (options.failCompletion && operation === 'update' && patch.status === 'SENT') return { error: new Error('persistence failure') };
      if (options.failLookup && table === 'profiles') return { error: new Error('lookup failure') };
      if (operation === 'upsert') {
        const inserted = patch.filter(row => !db[table].some(existing => existing.application_id === row.application_id));
        for (const row of inserted) db[table].push({ id: db[table].length + 1, status: 'PENDING', ...row });
        return { data: inserted.map(row => ({ ...row })) };
      }
      const rows = db[table].filter(row => filters.every(filter => filter(row))).slice(0, rowLimit);
      if (operation === 'update') for (const row of rows) Object.assign(row, patch);
      return { data: settings.head ? null : rows.map(row => ({ ...row })), count: rows.length };
    }
    return query;
  };
  const worker = load('src/lib/campaignReminderServer.ts', {
    'server-only': {}, '@/lib/supabase/admin': {},
    '@/lib/email': { sendEmail: async (...args) => {
      db.sends.push(args);
      if (options.mailError) throw options.mailError;
      return options.mailResult || { success: true, messageId: 'ses-test-id' };
    } },
  });
  return { db, ...worker };
}

test('deadline uses explicit application date, respects KST date-only end, and never infers recruitment end', () => {
  const now = new Date('2026-11-09T09:00:00Z');
  const options = [{ step1Data: { reviewDeadline: '2026-11-10' } }];
  assert.equal(core.getReminderDeadline('2026-11-08T23:00:00Z', options, now).isDeadlinePassed, true);
  assert.equal(core.getReminderDeadline(null, options, now).isDeadlinePassed, false);
  assert.match(core.getReminderDeadline(null, options, now).deadlineDate, /10일/);
  assert.equal(core.getReminderDeadline(null, { end_date: '2026-11-10' }, now).deadlineDate, '가이드 확인 또는 카카오톡 문의');
  assert.equal(core.getReminderDeadline('2026-02-30', options, now).deadlineDate, '가이드 확인 또는 카카오톡 문의');
  assert.equal(core.getReminderDeadline('2026-11-09', {}, new Date('2026-11-09T14:59:59Z')).isDeadlinePassed, false);
  assert.equal(core.getReminderDeadline('2026-11-09', {}, new Date('2026-11-09T15:00:00Z')).isDeadlinePassed, true);
  assert.equal(core.isReminderEligible({ status: 'approved', review_submitted: false }), true);
  assert.equal(core.isReminderEligible({ status: 'COMPLETED', review_submitted: false }), false);
});

test('shared guide extraction preserves purchase notes, summaries and bounded size', () => {
  assert.deepEqual(guide.getCampaignGuideContent([{ step2Data: { purchaseNotes: ' 주의 ', reviewMissionContent: '미션', missionGuide: '가이드' } }]), { purchaseNotes: '주의', guideSummary: '미션\n가이드' });
  const result = guide.getCampaignGuideContent({ step2Data: { purchaseNotes: 'x'.repeat(1200), missionGuide: 'y'.repeat(1200) } });
  assert.equal(result.purchaseNotes.length, 1000);
  assert.equal(result.guideSummary.length, 0);
});

test('concurrent workers and repeated execution send once and persist the provider id', async () => {
  const f = fixture();
  await Promise.all([f.runCampaignReminders(f.db, 'AUTOMATIC'), f.runCampaignReminders(f.db, 'AUTOMATIC')]);
  await f.runCampaignReminders(f.db, 'AUTOMATIC');
  assert.equal(f.db.sends.length, 1);
  assert.equal(f.db.campaign_reminder_deliveries[0].status, 'SENT');
  assert.equal(f.db.campaign_reminder_deliveries[0].message_id, 'ses-test-id');
  assert.equal(f.db.sends[0][1], 'CAMPAIGN_PROGRESS_REMINDER');
  assert.equal(f.db.sends[0][2].guideSummary, '가이드');
  assert.equal(f.db.sends[0][2].campaignUrl, 'https://daonview.com/campaigns/44#guide');
});

test('completed, cancelled, submitted, missing email, existing review and submission during lookup are excluded', async () => {
  for (const options of [
    { applications: [{ id: 10, status: 'CANCELLED' }] },
    { applications: [{ id: 10, status: 'COMPLETED' }] },
    { applications: [{ id: 10, status: 'SELECTED', review_submitted: true }] },
    { profiles: [{ id: 'reviewer', email: null }] },
    { reviews: [{ id: 5, user_id: 'reviewer', campaign_id: 44 }] },
    { completeDuringLookup: true },
  ]) {
    const f = fixture(options);
    const result = await f.runCampaignReminders(f.db, 'AUTOMATIC');
    assert.equal(result.skipped, 1);
    assert.equal(f.db.sends.length, 0);
  }
});

test('SES rejection is FAILED, lost response UNKNOWN, suppression SKIPPED and mock never SENT', async () => {
  for (const [options, status] of [
    [{ mailError: { $metadata: { httpStatusCode: 400 } } }, 'FAILED'],
    [{ mailError: new Error('timeout') }, 'UNKNOWN'],
    [{ mailResult: { success: false, skipped: true } }, 'SKIPPED'],
    [{ mailResult: { success: true, mock: true } }, 'FAILED'],
    [{ mailResult: { success: true } }, 'UNKNOWN'],
    [{ failLookup: true }, 'FAILED'],
  ]) {
    const f = fixture(options);
    await f.runCampaignReminders(f.db, 'AUTOMATIC');
    const sentCount = f.db.sends.length;
    await f.runCampaignReminders(f.db, 'AUTOMATIC');
    assert.equal(f.db.campaign_reminder_deliveries[0].status, status);
    assert.equal(f.db.sends.length, sentCount);
  }
});

test('crash after sending stays PROCESSING then becomes UNKNOWN without resending', async () => {
  const f = fixture({ failCompletion: true });
  await assert.rejects(f.runCampaignReminders(f.db, 'AUTOMATIC'));
  const row = f.db.campaign_reminder_deliveries[0];
  assert.equal(row.status, 'PROCESSING');
  row.claimed_at = '2020-01-01';
  const result = await f.runCampaignReminders(f.db, 'AUTOMATIC');
  assert.equal(result.staleUnknown, 1);
  assert.equal(row.status, 'UNKNOWN');
  assert.equal(f.db.sends.length, 1);
});

test('legacy seeding only selects campaign 44, preserves selection time and unique rows; Cron ignores manual jobs', async () => {
  const f = fixture({ jobs: [], applications: [
    { id: 10, campaign_id: 44, status: 'SELECTED', review_submitted: false, selected_at: null },
    { id: 11, campaign_id: 45, status: 'SELECTED', review_submitted: false },
    { id: 12, campaign_id: 44, status: 'COMPLETED', review_submitted: true },
  ] });
  assert.equal(await f.enqueueExistingEquviaReminders(f.db), 1);
  assert.equal(await f.enqueueExistingEquviaReminders(f.db), 0);
  assert.equal(f.db.applications[0].selected_at, null);
  assert.equal((await f.runCampaignReminders(f.db, 'AUTOMATIC')).claimed, 0);
});

test('Cron requires configured secret, real email config and exact manual campaign scope', async () => {
  let calls = 0;
  const env = { CRON_SECRET: 'test-secret' };
  const route = load('src/app/api/cron/campaign-reminders/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/supabase/admin': { createAdminClient: () => ({}) },
    '@/lib/campaignReminderServer': {
      canSendReminderEmails: () => true,
      enqueueExistingEquviaReminders: async () => 0,
      runCampaignReminders: async () => { calls++; return { sent: 0 }; },
    },
  }, { env });
  assert.equal((await route.GET(new Request('https://example.test'))).status, 401);
  const req = (campaignId) => new Request('https://example.test', { method: 'POST', headers: { authorization: 'Bearer test-secret' }, body: JSON.stringify({ campaignId }) });
  assert.equal((await route.POST(req(45))).status, 400);
  assert.equal((await route.POST(req(44))).status, 200);
  assert.equal(calls, 1);
  delete env.CRON_SECRET;
  assert.equal((await route.GET(new Request('https://example.test'))).status, 503);
});

test('real email sender enforces subscription policy, reports mock, and disables reminder SDK retries', async () => {
  let sesOptions, sends = 0;
  const state = { subscription: 'SUBSCRIBED', policyError: false };
  const runtimeProcess = { env: { NODE_ENV: 'production', AWS_ACCESS_KEY_ID: 'test', AWS_SECRET_ACCESS_KEY: 'test' } };
  const email = load('src/lib/email.ts', {
    './supabase/admin': { createAdminClient: () => ({ from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: { email_subscription_status: state.subscription }, error: state.policyError ? new Error('policy lookup failed') : null }) }) }) },
    '@aws-sdk/client-ses': { SESClient: class { constructor(options) { sesOptions = options; } async send() { sends++; return { MessageId: 'fake-id' }; } }, SendEmailCommand: class {} },
  }, runtimeProcess);
  const params = { nickname: '<리뷰어>', campaignTitle: '<캠페인>', campaignUrl: 'https://daonview.com/campaigns/44#guide', isDeadlinePassed: true };
  const template = await email.getEmailTemplateFromDB('CAMPAIGN_PROGRESS_REMINDER', params);
  assert.ok(template.html.includes('&lt;리뷰어&gt;'));
  assert.ok(template.html.includes('마감일이 지났습니다'));
  assert.ok(template.html.includes('마감일 연장 또는 체험 취소'));
  assert.ok(template.html.includes('https://pf.kakao.com/_xbxhDgn/chat'));
  assert.ok(template.html.includes('https://daonview.com/campaigns/44#guide'));
  await email.sendEmail('test@example.test', 'CAMPAIGN_PROGRESS_REMINDER', params);
  assert.equal(sesOptions.maxAttempts, 1);
  state.subscription = 'unsubscribed';
  assert.equal((await email.sendEmail('test@example.test', 'CAMPAIGN_PROGRESS_REMINDER', params)).skipped, true);
  state.policyError = true;
  assert.equal((await email.sendEmail('test@example.test', 'CAMPAIGN_PROGRESS_REMINDER', params)).success, false);
  state.policyError = false; state.subscription = 'SUBSCRIBED';
  runtimeProcess.env.NODE_ENV = 'development';
  assert.equal((await email.sendEmail('test@example.test', 'CAMPAIGN_PROGRESS_REMINDER', params)).mock, true);
  assert.equal(sends, 1);
});
