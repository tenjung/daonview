import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';
import { CAMPAIGN_CARD_SELECT, CAMPAIGN_DETAIL_SELECT } from '@/lib/campaignSelects';
import { toPublicCampaign } from '@/lib/publicCampaignDto';

export const PUBLIC_CAMPAIGNS_TAG = 'public-campaigns';
export const publicCampaignTag = (id: string | number) => `public-campaign:${id}`;

type PublicQueryError = { code?: string; message?: string } | null;

// 끊긴 연결 재사용 등 네트워크 실패는 PostgREST/Postgres 오류 코드가 비어 있다. 읽기 조회라 1회 재시도해도 안전하다.
async function runPublicRead<T extends { error: PublicQueryError }>(label: string, query: () => PromiseLike<T>): Promise<T> {
  const first = await query();
  if (!first.error || first.error.code) return first;
  console.warn(`[${label}] 네트워크 오류로 1회 재시도`, { message: first.error.message });
  return query();
}

function logPublicReadError(label: string, error: NonNullable<PublicQueryError>) {
  console.error(`[${label}] 조회 실패`, { code: error.code || 'NETWORK', message: error.message });
}

export const getPublicCampaignList = unstable_cache(async () => {
  const { data, error } = await runPublicRead('publicCampaignList', () => getPublicServerClient().from('campaigns')
    .select(CAMPAIGN_CARD_SELECT)
    .in('status', [...ACTIVE_CAMPAIGN_STATUSES])
    .order('created_at', { ascending: false }));
  if (error) {
    logPublicReadError('publicCampaignList', error);
    throw new Error('공개 캠페인 목록을 불러오지 못했습니다.');
  }
  return (data || []).map(row => toPublicCampaign(row));
}, ['public-campaign-list-v2'], { revalidate: 30, tags: [PUBLIC_CAMPAIGNS_TAG] });

export const getPublicCampaign = cache(async (id: string): Promise<Record<string, unknown> | null> => {
  if (!/^\d+$/.test(id)) return null;
  id = id.replace(/^0+(?=\d)/, '');
  if (id === '0') return null;
  return unstable_cache(async () => {
    const { data, error } = await runPublicRead(`publicCampaignDetail:${id}`, () => getPublicServerClient().from('campaigns')
      .select(CAMPAIGN_DETAIL_SELECT).eq('id', id)
      .in('status', [...ACTIVE_CAMPAIGN_STATUSES, 'COMPLETED']).maybeSingle());
    if (error) {
      logPublicReadError(`publicCampaignDetail:${id}`, error);
      throw new Error('공개 캠페인 정보를 불러오지 못했습니다.');
    }
    return data ? toPublicCampaign(data as unknown as Record<string, unknown>) : null;
  }, ['public-campaign-detail-v2', id], { revalidate: 60, tags: [publicCampaignTag(id)] })();
});
