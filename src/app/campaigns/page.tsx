import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase/client';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import CampaignListClient from '@/components/CampaignListClient';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';

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
    // Fetch all campaigns on the server
    const { data: rawCampaigns } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
        .order('created_at', { ascending: false });

    const campaigns = (rawCampaigns || []).map(c => mapCampaignToCard(c as any));

    return (
        <div className="min-h-screen bg-white">
            <CampaignListClient initialCampaigns={campaigns} />
        </div>
    );
}
