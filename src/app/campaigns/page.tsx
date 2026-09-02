import type { Metadata } from 'next';
import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { isCampaignOpenForApplications, mapCampaignToCard } from '@/lib/campaignUtils';
import CampaignListClient from '@/components/CampaignListClient';
import { ACTIVE_CAMPAIGN_STATUSES, SELECTED_APPLICATION_STATUSES } from '@/constants/campaign';
import { CAMPAIGN_CARD_SELECT } from '@/lib/campaignSelects';
import type { Campaign } from '@/types/database';

export const revalidate = 30; // ISR: 30초마다 재생성

export const metadata: Metadata = {
  title: '체험단 모집',
  description: '블로그, 인스타그램, 유튜브 체험단 모집을 한 곳에서 확인하고 원하는 캠페인에 바로 신청하세요.',
  keywords: ['체험단 모집', '체험단 신청', '블로그 체험단', '인스타그램 체험단', '유튜브 체험단', '다온뷰 캠페인'],
  openGraph: {
    title: '체험단 모집 | 다온뷰',
    description: '블로그, 인스타그램, 유튜브 체험단 모집을 한 곳에서 확인하고 원하는 캠페인에 바로 신청하세요.',
    url: 'https://daonview.com/campaigns',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/campaigns',
  },
};


export default async function CampaignsPage() {
    const supabase = getPublicServerClient();
    // Fetch all campaigns on the server
    const { data: rawCampaigns, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_CARD_SELECT)
        .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
        .in('selected_applications.status', SELECTED_APPLICATION_STATUSES as unknown as string[])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[CampaignsPage] Failed to fetch campaigns:', error.message);
    }

    const campaigns = (rawCampaigns || [])
        .filter((campaign) => isCampaignOpenForApplications(campaign))
        .map((campaign) =>
            mapCampaignToCard(campaign as Campaign & { applications?: { count: number }[] | { count: number } | number })
        );

    return (
        <div className="min-h-screen bg-white">
            <CampaignListClient initialCampaigns={campaigns} />
        </div>
    );
}
