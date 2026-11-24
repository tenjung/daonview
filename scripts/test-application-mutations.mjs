import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

function fixture({ anonymous = false, full = false, cancelled = false, otherOwner = false, cacheFailure = false, target = 1, applicantCount = 3 } = {}) {
  const writes = [], invalidations = [], reads = [], notices = [];
  // 선정 인원·신청 수는 RLS 영향이 없는 계산 컬럼(selected_count, applicant_count)으로 판정한다.
  const campaign = { id: 44, title: '테스트', created_by: 'brand', status: 'RECRUITING', type: 'VISIT', platform: 'BLOG', total_recruitment: target, end_date: '2099-12-31', applicant_count: applicantCount, selected_count: full ? target : 0, campaign_options: {} };
  const adminClient = { from(table) { return { insert: async (data) => { notices.push({ table, data }); return { error: null }; } }; } };
  const supabase = { from(table) {
    let operation = 'read', payload, columns = ''; const filters = [];
    const q = { select(cols) { if (typeof cols === 'string') columns = cols; return this; }, eq(...args) { filters.push(args); return this; }, in(...args) { filters.push(args); return this; }, order() { return this; }, limit() { return this; },
      insert(data) { operation = 'insert'; payload = data; return this; },
      delete() { operation = 'delete'; return this; },
      result() {
        reads.push({ table, filters, columns });
        if (operation !== 'read') { writes.push({ table, operation, payload, filters }); return { data: cancelled && operation === 'delete' ? [] : [{ id: 5 }], error: null }; }
        if (table === 'campaigns') return { data: campaign, error: null };
        if (filters.some(([key, value]) => key === 'user_id' && value === 'actor')) return { data: otherOwner ? null : { id: 5, campaign_id: 44, status: 'PENDING' }, error: null };
        return { count: 0, data: [], error: null };
      },
      maybeSingle() { return Promise.resolve(this.result()); },
      single() { const result = this.result(); return Promise.resolve({ ...result, data: result.data?.[0] }); },
      then(resolve) { return Promise.resolve(this.result()).then(resolve); },
    }; return q;
  } };
  const { POST } = load('src/app/api/applications/mutate/route.ts', {
    '@/lib/auth/requestAuth': { getRequestAuth: async () => ({ supabase, user: anonymous ? null : { id: 'actor' }, profile: { phone_number: '01012345678', blog_url: 'https://example.com' }, role: 'INFLUENCER', profileError: null }) },
    '@/lib/campaignCache': { invalidatePublicCampaigns: ids => { invalidations.push(ids); return cacheFailure ? '저장은 완료됐으나 캐시 실패' : undefined; } },
    '@/lib/supabase/admin': { createAdminClient: () => adminClient },
  });
  return { writes, invalidations, reads, notices, run: body => POST(new Request('https://test.local', { method: 'POST', body: JSON.stringify(body) })) };
}
const apply = { action: 'APPLY', campaignId: 44, selectedOption: null, message: null, user_id: 'forged', status: 'APPROVED' };
test('application uses latest capacity and authenticated identity; full and anonymous writes denied', async () => {
  const f = fixture(); assert.equal((await f.run(apply)).status, 200);
  assert.equal(f.writes[0].payload.user_id, 'actor'); assert.equal(f.writes[0].payload.status, 'PENDING');
  assert(f.reads.some(q => q.table === 'campaigns' && q.columns.includes('selected_count')));
  assert(!f.reads.some(q => q.columns.includes('applications(count)')));
  for (const options of [{ full: true }, { anonymous: true }]) { const blocked = fixture(options); assert((await blocked.run(apply)).status >= 400); assert.equal(blocked.writes.length, 0); }
});
test('milestone notice uses re-read applicant_count, not the RLS-limited session count', async () => {
  const half = fixture({ target: 10, applicantCount: 5 });
  assert.equal((await half.run(apply)).status, 200);
  assert.equal(half.notices.length, 1);
  assert.equal(half.notices[0].data.user_id, 'brand');
  assert.match(half.notices[0].data.title, /50%/);
  assert(!half.reads.some(q => q.table === 'applications' && q.filters.some(([key]) => key === 'campaign_id')));
  assert(half.reads.some(q => q.table === 'campaigns' && q.columns === 'applicant_count'));
  const none = fixture({ target: 10, applicantCount: 4 });
  assert.equal((await none.run(apply)).status, 200);
  assert.equal(none.notices.length, 0);
});
test('cancel is owner scoped and conditional on still pending; races do not invalidate', async () => {
  const body = { action: 'CANCEL', applicationId: 5 };
  const other = fixture({ otherOwner: true }); assert.equal((await other.run(body)).status, 404); assert.equal(other.writes.length, 0);
  const race = fixture({ cancelled: true }); assert.equal((await race.run(body)).status, 409); assert.equal(race.invalidations.length, 0);
  assert(race.writes[0].filters.some(([key, value]) => key === 'status' && value === 'PENDING'));
});
test('cache failure after successful application warns without retrying the write', async () => {
  const f = fixture({ cacheFailure: true }); const response = await f.run(apply); const body = await response.json();
  assert.equal(response.status, 200); assert.match(body.cacheWarning, /캐시 실패/);
  assert.equal(f.writes.filter(q => q.table === 'applications').length, 1); assert.equal(f.invalidations.length, 1);
});

test('manager batch validates every owner before service access and requires cancellation reason', async () => {
  const created = [], writes = [];
  function manager(role, owners = ['actor'], anonymous = false) {
    const { POST } = load('src/app/api/applications/manage/route.ts', {
      '@/lib/auth/requestAuth': { getRequestAuth: async () => ({ user: anonymous ? null : { id: 'actor' }, role, profile: { role }, profileError: null, supabase: {
        from: () => ({ select() { return this; }, async in() { return { data: owners.map((owner, i) => ({ id: i + 1, campaign_id: 44 + i, campaigns: { created_by: owner } })), error: null }; } }),
      } }) },
      '@/lib/supabase/admin': { createAdminClient: () => { created.push(true); return { from: () => ({ update(data) { writes.push(data); return this; }, in() { return this; }, async select() { return {data:owners.map((_,i) => ({id:i+1})),error:null}; } }) }; } },
      '@/lib/campaignCache': { invalidatePublicCampaigns: () => undefined },
    });
    return body => POST(new Request('https://test.local', {method:'POST',body:JSON.stringify(body)}));
  }
  const rejected = { ids: [1, 2], status: 'REJECTED' };
  assert.equal((await manager('ADVERTISER', ['actor', 'other'])(rejected)).status, 403);
  assert.equal((await manager('INFLUENCER')({ids:[1],status:'REJECTED'})).status, 403);
  assert.equal((await manager('ADMIN', ['actor'], true)({ids:[1],status:'REJECTED'})).status, 401);
  assert.equal((await manager('ADVERTISER')({ids:[1],status:'CANCELLED',reason:' '})).status, 400);
  assert.equal(created.length, 0); assert.equal(writes.length, 0);
  assert.equal((await manager('ADVERTISER')({ids:[1],status:'CANCELLED',reason:'본인 요청'})).status, 200);
  assert.equal(created.length, 1); assert.equal(writes[0].cancellation_reason, '본인 요청');
});
