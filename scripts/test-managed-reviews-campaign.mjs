import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

// getManagedReviewsForActor 캠페인 필터: 권한 범위 안에서만 해당 캠페인 리뷰를 조회하는지 확인
function fixture({ role = 'ADMIN', ownedCampaignIds = [] } = {}) {
  const reviewFilters = [];
  const query = (table) => {
    const state = { table, filters: [] };
    const chain = {
      select: () => chain,
      order: () => chain,
      eq: (column, value) => { state.filters.push(['eq', column, value]); return chain; },
      in: (column, value) => { state.filters.push(['in', column, value]); return chain; },
      then: (resolve) => {
        if (table === 'reviews') {
          reviewFilters.push(...state.filters);
          return resolve({ data: [], error: null });
        }
        if (table === 'campaigns') return resolve({ data: ownedCampaignIds.map((id) => ({ id })), error: null });
        return resolve({ data: [], error: null });
      },
    };
    return chain;
  };
  const admin = { from: query, storage: { from: () => ({ createSignedUrls: async () => ({ data: [], error: null }) }) } };
  const mod = load('src/lib/reviews/management.ts', {
    'server-only': {},
    '@/lib/auth/requestAuth': { requireRequestUser: async () => ({ user: { id: 'actor' }, profile: { role } }) },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/campaignPermissions': {
      normalizeRoleValue: (value) => String(value || '').toUpperCase(),
      isAdminRole: (value) => value === 'ADMIN',
    },
    '@/lib/campaignPurchase': { isPurchaseReviewCampaign: () => false },
    '@/lib/reviews/proofStorage': { REVIEW_PROOF_BUCKET: 'review-proofs', isReviewProofPath: () => false },
  });
  return { mod, reviewFilters };
}

test('관리자는 지정한 캠페인 리뷰만 조회한다', async () => {
  const { mod, reviewFilters } = fixture();
  await mod.getManagedReviewsForActor('actor', undefined, { campaignId: 44 });
  assert.deepEqual(reviewFilters, [['eq', 'campaign_id', 44]]);
});

test('광고주는 본인 캠페인이면 해당 캠페인만 조회한다', async () => {
  const { mod, reviewFilters } = fixture({ role: 'ADVERTISER', ownedCampaignIds: [44, 50] });
  await mod.getManagedReviewsForActor('actor', undefined, { campaignId: 44 });
  assert.deepEqual(reviewFilters, [['eq', 'campaign_id', 44]]);
});

test('광고주는 남의 캠페인을 지정하면 빈 목록이고 리뷰를 조회하지 않는다', async () => {
  const { mod, reviewFilters } = fixture({ role: 'ADVERTISER', ownedCampaignIds: [50] });
  const result = await mod.getManagedReviewsForActor('actor', undefined, { campaignId: 44 });
  assert.deepEqual(result, []);
  assert.deepEqual(reviewFilters, []);
});

test('캠페인 지정이 없으면 기존처럼 광고주 본인 캠페인 전체를 조회한다', async () => {
  const { mod, reviewFilters } = fixture({ role: 'ADVERTISER', ownedCampaignIds: [44, 50] });
  await mod.getManagedReviewsForActor('actor');
  assert.deepEqual(reviewFilters, [['in', 'campaign_id', [44, 50]]]);
});
