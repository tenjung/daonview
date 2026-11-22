import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

test('public DTO strips draft, billing, coupon and private link pools before caching', () => {
  const { toPublicCampaign } = load('src/lib/publicCampaignDto.ts');
  const result = toPublicCampaign({ id: 44, campaign_options: {
    step1Data: { productUrlPrivate: true, productUrl: 'secret', purchaseLinkPools: ['secret'], productName: 'sample' },
    step2Data: { reviewMissionContent: 'guide', unknownSensitive: 'secret' },
    step3Data: { depositorName: 'private' }, coupon_code: 'secret',
  } });
  const text = JSON.stringify(result);
  assert(!text.includes('secret')); assert(!text.includes('private'));
  assert.equal(result.campaign_options.step1Data.productName, 'sample');
  assert.equal(result.campaign_options.step2Data.reviewMissionContent, 'guide');
});
test('invalidation expires all public tags immediately and failure returns warning', () => {
  const calls = [];
  const { invalidatePublicCampaigns } = load('src/lib/campaignCache.ts', {
    'server-only': {}, 'next/cache': {
      revalidateTag: (...args) => calls.push(['tag', ...args]),
      revalidatePath: (...args) => calls.push(['path', ...args]),
    },
  });
  assert.equal(invalidatePublicCampaigns([44]), undefined);
  for (const tag of ['public-campaigns', 'public-campaign:44', 'home-banner-data']) {
    assert(calls.some(call => call[0] === 'tag' && call[1] === tag && call[2].expire === 0));
  }
  const failed = load('src/lib/campaignCache.ts', { 'server-only': {}, 'next/cache': { revalidateTag: () => { throw Error('cache unavailable'); } } });
  assert.match(failed.invalidatePublicCampaigns([44]), /저장은 완료/);
});
test('campaign save ignores caller ownership/status; cross-owner edits do not write', async () => {
  const writes = [];
  function fixture(owner = 'actor', role = 'ADVERTISER') {
    const query = { eq() { return this; }, select() { return this; }, single: async () => ({ data: { id: 44 }, error: null }), maybeSingle: async () => ({ data: { created_by: owner }, error: null }) };
    const supabase = { from: () => ({ ...query, insert: (data) => { writes.push(data); return query; }, update: (data) => { writes.push(data); return query; } }) };
    return load('src/app/api/campaigns/save/route.ts', {
      '@/lib/auth/requestAuth': { getRequestAuth: async () => ({ user: { id: 'actor' }, role, profileError: null, supabase }) },
      '@/lib/campaignCache': { invalidatePublicCampaigns: () => undefined },
    });
  }
  const request = body => new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) });
  const campaign = { title: 'sample', type: 'DELIVERY', platform: 'BLOG', created_by: 'forged', status: 'RECRUITING' };
  assert.equal((await fixture().POST(request({ campaign }))).status, 200);
  assert.equal(writes[0].created_by, 'actor'); assert.equal(writes[0].status, 'PENDING');
  assert.equal((await fixture('other').POST(request({ campaignId: 44, campaign }))).status, 403);
  assert.equal(writes.length, 1);
});


test('public cache keys separate campaigns, use bounded TTLs, and cache sanitized DTOs', async () => {
  const configs = [], persisted = [], reads = [];
  const { getPublicCampaign, getPublicCampaignList } = load('src/lib/publicCampaignServer.ts', {
    'server-only': {}, react: { cache: fn => fn },
    'next/cache': { unstable_cache: (fn, key, options) => {
      configs.push({key, options});
      return async () => { const value = await fn(); persisted.push(JSON.stringify(value)); return value; };
    } },
    '@/lib/supabase/publicServer': { getPublicServerClient: () => ({ from() {
      let id;
      const query = { select() { return this; }, eq(_key, value) { id = value; return this; }, in() { return this; }, order() { return this; },
        row() { return { id: id || 'list', campaign_options: { step1Data: { productUrlPrivate: true, productUrl: 'private-secret', purchaseLinkPools: ['private-secret'] }, step3Data: { account: 'private-secret' } } }; },
        async maybeSingle() { reads.push(id); return { data: this.row(), error: null }; },
        then(resolve) { return Promise.resolve({data:[this.row()],error:null}).then(resolve); },
      }; return query;
    } }) },
  });
  assert.equal(await getPublicCampaign('bad-id'), null);
  assert.equal((await getPublicCampaign('44')).id, '44');
  assert.equal((await getPublicCampaign('43')).id, '43');
  await getPublicCampaignList();
  assert.deepEqual(reads, ['44', '43']);
  assert(configs.some(c => c.options.revalidate === 30 && c.options.tags.includes('public-campaigns')));
  for (const id of ['44','43']) assert(configs.some(c => c.options.revalidate === 60 && c.key.includes(id) && c.options.tags.includes('public-campaign:' + id)));
  assert(persisted.every(value => !value.includes('private-secret')));
});
