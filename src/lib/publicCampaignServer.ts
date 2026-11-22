import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';
import { CAMPAIGN_CARD_SELECT, CAMPAIGN_DETAIL_SELECT } from '@/lib/campaignSelects';
import { toPublicCampaign } from '@/lib/publicCampaignDto';

export const PUBLIC_CAMPAIGNS_TAG = 'public-campaigns';
export const publicCampaignTag = (id: string | number) => `public-campaign:${id}`;

export const getPublicCampaignList = unstable_cache(async () => {
  const { data, error } = await getPublicServerClient().from('campaigns')
    .select(CAMPAIGN_CARD_SELECT)
    .in('status', [...ACTIVE_CAMPAIGN_STATUSES])
    .order('created_at', { ascending: false });
  if (error) throw new Error('공개 캠페인 목록을 불러오지 못했습니다.');
  return (data || []).map(row => toPublicCampaign(row));
}, ['public-campaign-list-v2'], { revalidate: 30, tags: [PUBLIC_CAMPAIGNS_TAG] });

export const getPublicCampaign = cache(async (id: string): Promise<Record<string, unknown> | null> => {
  if (!/^\d+$/.test(id)) return null;
  id = id.replace(/^0+(?=\d)/, '');
  if (id === '0') return null;
  return unstable_cache(async () => {
    const { data, error } = await getPublicServerClient().from('campaigns')
      .select(CAMPAIGN_DETAIL_SELECT).eq('id', id)
      .in('status', [...ACTIVE_CAMPAIGN_STATUSES, 'COMPLETED']).maybeSingle();
    if (error) throw new Error('공개 캠페인 정보를 불러오지 못했습니다.');
    return data ? toPublicCampaign(data as unknown as Record<string, unknown>) : null;
  }, ['public-campaign-detail-v2', id], { revalidate: 60, tags: [publicCampaignTag(id)] })();
});
