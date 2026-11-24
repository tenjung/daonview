import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

const baseRow = { id: 7, user_id: 'influencer', status: 'SELECTED', purchased_at: null, review_deadline: '2026-12-01T00:00:00.000Z', extension_status: 'NONE', campaigns: { created_by: 'brand' } };

function fixture({ actor = 'influencer', role = 'INFLUENCER', row = {}, raceLost = false } = {}) {
  const writes = [];
  const current = row === null ? null : { ...baseRow, ...row };
  const userClient = { from() {
    const q = { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: current, error: null }) };
    return q;
  } };
  const adminClient = { from(table) {
    let payload; const filters = [];
    const q = { update(data) { payload = data; return this; }, eq(...a) { filters.push(['eq', ...a]); return this; }, in(...a) { filters.push(['in', ...a]); return this; }, is(...a) { filters.push(['is', ...a]); return this; }, select() { return this; },
      maybeSingle: async () => { writes.push({ table, payload, filters }); return { data: raceLost ? null : { id: 7, review_deadline: payload.review_deadline ?? current?.review_deadline ?? null }, error: null }; } };
    return q;
  } };
  const { POST } = load('src/app/api/applications/progress/route.ts', {
    '@/lib/auth/requestAuth': { getRequestAuth: async () => ({ supabase: userClient, user: { id: actor }, profile: { role }, role, profileError: null }) },
    '@/lib/supabase/admin': { createAdminClient: () => adminClient },
    '@/lib/campaignPermissions': { canEditCampaign: ({ role: r, userId, campaignCreatorId }) => r === 'ADMIN' || (r === 'ADVERTISER' && userId === campaignCreatorId) },
  });
  return { writes, run: body => POST(new Request('https://test.local', { method: 'POST', body: JSON.stringify(body) })) };
}

test('influencer confirms own purchase once; server sets times and guards purchased_at', async () => {
  const f = fixture();
  const res = await f.run({ action: 'CONFIRM_PURCHASE', applicationId: 7, purchased_at: '1999-01-01' });
  assert.equal(res.status, 200);
  assert.equal(f.writes.length, 1);
  assert.deepEqual(Object.keys(f.writes[0].payload).sort(), ['purchased_at', 'review_deadline']);
  assert.notEqual(f.writes[0].payload.purchased_at, '1999-01-01');
  assert(f.writes[0].filters.some(([op, col]) => op === 'is' && col === 'purchased_at'));
  const again = fixture({ row: { purchased_at: '2026-11-20T00:00:00.000Z' } });
  assert.equal((await again.run({ action: 'CONFIRM_PURCHASE', applicationId: 7 })).status, 409);
  assert.equal(again.writes.length, 0);
});

test('influencer actions are owner-only and need a selected application', async () => {
  const other = fixture({ actor: 'someone-else' });
  assert.equal((await other.run({ action: 'REQUEST_EXTENSION', applicationId: 7, reason: '사유' })).status, 403);
  const pending = fixture({ row: { status: 'PENDING' } });
  assert.equal((await pending.run({ action: 'CONFIRM_PURCHASE', applicationId: 7 })).status, 409);
  const missing = fixture({ row: null });
  assert.equal((await missing.run({ action: 'CONFIRM_PURCHASE', applicationId: 7 })).status, 404);
  assert.equal(other.writes.length + pending.writes.length + missing.writes.length, 0);
  const ok = fixture();
  assert.equal((await ok.run({ action: 'REQUEST_EXTENSION', applicationId: 7, reason: '  배송 지연  ' })).status, 200);
  assert.deepEqual(ok.writes[0].payload, { extension_status: 'PENDING', extension_reason: '배송 지연' });
});

test('advertiser owner registers tracking; non-owner advertiser and influencer are denied', async () => {
  const owner = fixture({ actor: 'brand', role: 'ADVERTISER' });
  assert.equal((await owner.run({ action: 'REGISTER_TRACKING', applicationId: 7, company: 'CJ대한통운', number: '123' })).status, 200);
  assert.equal(owner.writes[0].payload.tracking_number, '123');
  assert(owner.writes[0].payload.shipped_at && owner.writes[0].payload.review_deadline);
  for (const opts of [{ actor: 'other-brand', role: 'ADVERTISER' }, { actor: 'influencer', role: 'INFLUENCER' }]) {
    const denied = fixture(opts);
    assert.equal((await denied.run({ action: 'REGISTER_TRACKING', applicationId: 7, company: 'A', number: '1' })).status, 403);
    assert.equal(denied.writes.length, 0);
  }
});

test('extension decision requires a pending request and extends from the stored deadline', async () => {
  const none = fixture({ actor: 'brand', role: 'ADVERTISER' });
  assert.equal((await none.run({ action: 'DECIDE_EXTENSION', applicationId: 7, decision: 'APPROVED' })).status, 409);
  assert.equal(none.writes.length, 0);
  const pending = fixture({ actor: 'brand', role: 'ADVERTISER', row: { extension_status: 'PENDING' } });
  const res = await pending.run({ action: 'DECIDE_EXTENSION', applicationId: 7, decision: 'APPROVED' });
  assert.equal(res.status, 200);
  assert.equal(pending.writes[0].payload.review_deadline, '2026-12-08T00:00:00.000Z');
  assert(pending.writes[0].filters.some(([op, col, value]) => op === 'eq' && col === 'extension_status' && value === 'PENDING'));
  assert.equal((await res.json()).reviewDeadline, '2026-12-08T00:00:00.000Z');
});

test('a concurrent change that matches no row returns 409 instead of success', async () => {
  const f = fixture({ raceLost: true });
  assert.equal((await f.run({ action: 'CONFIRM_PURCHASE', applicationId: 7 })).status, 409);
});
