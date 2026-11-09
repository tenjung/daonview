// Run: node --test scripts/test-review-approval.mjs (no database writes or emails)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

function fixture(options = {}) {
  const review = { id: 1, user_id: 'reviewer', campaign_id: 2, status: 'PENDING', ...options.review };
  const sends = [];
  const campaign = { title: '실제 캠페인', type: 'DELIVERY', platform: 'BLOG', campaign_options: {}, ...options.campaign };
  const admin = {
    from(table) {
      let payload;
      const filters = {};
      const query = {
        select() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        is(key, value) { filters[key] = value; return query; },
        update(value) { payload = value; return query; },
        async maybeSingle() {
          if (table === 'reviews') {
            if (!payload) return { data: { ...review } };
            if (options.updateError) return { error: new Error('update failed') };
            if (filters.status !== review.status) return { data: null };
            Object.assign(review, payload);
            return { data: { id: review.id } };
          }
          if (table === 'campaigns') return { data: options.missingCampaign ? null : campaign };
          if (filters.id === 'actor') return { data: { role: options.role || 'ADMIN' } };
          return { data: { email: options.missingEmail ? null : 'test@example.com', nickname: '리뷰어' } };
        },
      };
      return query;
    },
  };
  const { POST } = load('src/app/api/hide-review/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status || 200 }) } },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: options.anonymous ? null : { id: 'actor' } } }) } }) },
    '@/lib/campaignPermissions': { normalizeRoleValue: (value) => String(value).toUpperCase(), isAdminRole: (value) => value === 'ADMIN' },
    '@/lib/email': { sendEmail: async (...args) => {
      sends.push(args);
      if (options.mailError) throw new Error('SES failed');
      return options.mailResult || { success: true, messageId: 'ses-id' };
    } },
  });
  return { review, sends, approve: (status = 'APPROVED') => POST({ json: async () => ({ reviewId: 1, status }) }) };
}

test('approval uses campaign title and only purchase campaigns get payback flag', async () => {
  for (const [campaign, expected] of [
    [{ platform: 'BLOG' }, false],
    [{ platform: 'purchase' }, true],
    [{ campaign_options: { step1Data: { includeReview: true } } }, true],
  ]) {
    const f = fixture({ campaign });
    const response = await f.approve();
    assert.equal(response.body.emailNotification.status, 'SENT');
    assert.equal(f.review.status, 'APPROVED');
    assert.equal(f.sends[0][1], 'REVIEW_APPROVED');
    assert.equal(f.sends[0][2].campaignTitle, '실제 캠페인');
    assert.equal(f.sends[0][2].isPurchaseReview, expected);
  }
});

test('concurrent and repeated approvals send at most once; restoration never sends', async () => {
  const f = fixture();
  const responses = await Promise.all([f.approve(), f.approve()]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  await f.approve();
  assert.equal(f.sends.length, 1);
  for (const status of ['HIDDEN', 'APPROVED', 'REJECTED']) {
    const restored = fixture({ review: { status } });
    assert.equal((await restored.approve()).body.emailNotification.status, 'NOT_REQUIRED');
    assert.equal(restored.sends.length, 0);
  }
});

test('mail failure, missing data, suppression and mock preserve approval with distinct result', async () => {
  for (const [options, expected] of [
    [{ mailError: true }, 'FAILED'],
    [{ missingEmail: true }, 'SKIPPED'],
    [{ missingCampaign: true }, 'FAILED'],
    [{ mailResult: { success: false, skipped: true } }, 'SKIPPED'],
    [{ mailResult: { success: true, mock: true } }, 'MOCK'],
  ]) {
    const f = fixture(options);
    const response = await f.approve();
    assert.equal(response.status, 200);
    assert.equal(f.review.status, 'APPROVED');
    assert.equal(response.body.emailNotification.status, expected);
  }
});

test('unauthorized and failed updates never send; hiding and rejection never send', async () => {
  for (const [options, status] of [[{ anonymous: true }, 401], [{ role: 'INFLUENCER' }, 403], [{ updateError: true }, 500]]) {
    const f = fixture(options);
    assert.equal((await f.approve()).status, status);
    assert.equal(f.sends.length, 0);
  }
  for (const status of ['HIDDEN', 'REJECTED']) {
    const f = fixture();
    await f.approve(status);
    assert.equal(f.sends.length, 0);
  }
});

test('approval template escapes user content, includes inquiry link, and bypasses DB templates', async () => {
  const { getEmailTemplateFromDB } = load('src/lib/email.ts', {
    './supabase/admin': { createAdminClient: () => { throw new Error('DB template must not be queried'); } },
  });
  for (const isPurchaseReview of [true, false]) {
    const { html, subject } = await getEmailTemplateFromDB('REVIEW_APPROVED', {
      nickname: '<img onerror=alert(1)>', campaignTitle: '<캠페인>&', isPurchaseReview,
    });
    assert.ok(subject.includes('리뷰가 승인되었습니다'));
    assert.ok(html.includes('&lt;img onerror=alert(1)&gt;'));
    assert.ok(html.includes('&lt;캠페인&gt;&amp;'));
    assert.ok(!html.includes('<img onerror'));
    assert.equal(html.includes('1~2일 내에'), isPurchaseReview);
    assert.ok(html.includes('https://pf.kakao.com/_xbxhDgn/chat'));
    assert.ok(html.includes('daonview_logo.png'));
  }
});
