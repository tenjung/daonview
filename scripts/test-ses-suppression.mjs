import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

// 실제 emailFeedback.ts·sesSuppressionSync.ts를 가짜 SES·가짜 DB로 실행한다. 네트워크·DB·.env 사용 없음.
const feedback = load('src/lib/emailFeedback.ts');
const item = (email = 'a@example.com', reason = 'BOUNCE', messageId = 'm-1', feedbackId = 'f-1') => ({
  EmailAddress: email, Reason: reason, LastUpdateTime: new Date('2026-11-26T09:36:43Z'),
  Attributes: { MessageId: messageId, FeedbackId: feedbackId },
});

test('차단 목록 반송은 영구 반송(SUPPRESSED), 신고는 COMPLAINT로 변환', () => {
  const bounce = feedback.normalizeSuppressedDestination(item('A@Example.com'));
  assert.equal(bounce.source, 'SES_SUPPRESSION');
  assert.equal(bounce.recipient, 'a@example.com');
  assert.equal(bounce.event_type, 'BOUNCE');
  assert.equal(bounce.bounce_type, 'PERMANENT');
  assert.equal(bounce.reason, 'SUPPRESSED');
  assert.equal(bounce.message_id, 'm-1');
  assert.equal(bounce.occurred_at, '2026-11-26T09:36:43.000Z');
  assert.equal(bounce.event_key, feedback.normalizeSuppressedDestination(item()).event_key, '대소문자 달라도 같은 키');
  const complaint = feedback.normalizeSuppressedDestination(item('a@example.com', 'COMPLAINT'));
  assert.equal(complaint.event_type, 'COMPLAINT');
  assert.equal(complaint.bounce_type, null);
  assert.throws(() => feedback.normalizeSuppressedDestination({ ...item(), Attributes: {} }));
});

function fixture({ destinations, knownMessageIds = [], insertResult = true, holds = [] }) {
  const state = { rpc: [], listInput: null };
  class ListSuppressedDestinationsCommand { constructor(input) { this.input = input; this.kind = 'LIST'; } }
  class GetSuppressedDestinationCommand { constructor(input) { this.input = input; this.kind = 'GET'; } }
  const ses = {
    async send(cmd) {
      if (cmd.kind === 'LIST') { state.listInput = cmd.input; return { SuppressedDestinationSummaries: destinations.map((d) => ({ EmailAddress: d.EmailAddress })) }; }
      return { SuppressedDestination: destinations.find((d) => d.EmailAddress === cmd.input.EmailAddress) };
    },
  };
  const admin = {
    from(table) {
      const filters = {};
      const q = {
        select() { return q; },
        eq(col, val) { filters[col] = val; return q; },
        is() { return Promise.resolve({ data: table === 'selection_email_holds' ? holds : [], error: null }); },
        limit() { return Promise.resolve({ data: knownMessageIds.includes(filters.message_id) ? [{ event_key: 'x' }] : [], error: null }); },
      };
      return q;
    },
    async rpc(name, args) { state.rpc.push({ name, args }); return { data: insertResult, error: null }; },
  };
  const mod = load('src/lib/sesSuppressionSync.ts', {
    'server-only': {},
    '@aws-sdk/client-sesv2': { SESv2Client: class {}, ListSuppressedDestinationsCommand, GetSuppressedDestinationCommand },
  });
  return { mod, ses, admin, state };
}
const NOW = new Date('2026-11-26T09:00:00Z');

test('최근 3일만 조회하고, 이미 기록된 메시지 ID는 다시 저장하지 않는다(해제한 보류 재오픈 방지)', async () => {
  const { mod, ses, admin, state } = fixture({ destinations: [item('a@example.com', 'BOUNCE', 'known')], knownMessageIds: ['known'] });
  const result = await mod.syncSesSuppressionList(admin, ses, NOW);
  assert.equal(state.listInput.StartDate.toISOString(), '2026-11-23T09:00:00.000Z');
  assert.equal(result.skippedKnown, 1);
  assert.equal(result.recorded, 0);
  assert.equal(state.rpc.length, 0);
});

test('새 반송은 기록하고, 트리거가 만든 미해제 보류를 알림 대상으로 돌려준다', async () => {
  const holds = [{ application_id: 142, application: { campaign_id: 43, campaign: { title: '캠페인' }, user: { nickname: 'Kim', name: null } } }];
  const { mod, ses, admin, state } = fixture({ destinations: [item()], holds });
  const result = await mod.syncSesSuppressionList(admin, ses, NOW);
  assert.equal(state.rpc[0].name, 'record_email_feedback');
  assert.equal(state.rpc[0].args.p_event.source, 'SES_SUPPRESSION');
  assert.equal(result.recorded, 1);
  assert.deepEqual(result.newHolds, [{ applicationId: 142, campaignId: 43, campaignTitle: '캠페인', influencerName: 'Kim', occurredAt: '2026-11-26T09:36:43.000Z' }]);
});

test('중복 키로 저장되지 않으면(동시 실행) 알림 대상이 아니다', async () => {
  const { mod, ses, admin } = fixture({ destinations: [item()], insertResult: false, holds: [{ application_id: 1, application: { campaign_id: 1 } }] });
  const result = await mod.syncSesSuppressionList(admin, ses, NOW);
  assert.equal(result.recorded, 0);
  assert.equal(result.newHolds.length, 0);
});

test('크론은 CRON_SECRET 없거나 틀리면 실행하지 않는다', async () => {
  const route = (env) => load('src/app/api/cron/sync-email-suppression/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => ({ status: init?.status ?? 200, body }) } },
    '@/lib/supabase/admin': { createAdminClient: () => { throw new Error('no db'); } },
    '@/lib/sesSuppressionSync': { syncSesSuppressionList: () => { throw new Error('no ses'); } },
    '@/lib/email': { sendAdminEmailHoldNotice: () => { throw new Error('no mail'); } },
  }, { ...process, env });
  assert.equal((await route({}).GET(new Request('https://x.test'))).status, 503);
  const req = new Request('https://x.test', { headers: { authorization: 'Bearer wrong' } });
  assert.equal((await route({ CRON_SECRET: 's' }).GET(req)).status, 401);
});
