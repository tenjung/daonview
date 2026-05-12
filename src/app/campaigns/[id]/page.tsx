import { getPublicServerClient } from '@/lib/supabase/publicServer';
import CampaignDetailClient from '@/components/CampaignDetailClient';
import { notFound } from 'next/navigation';
import { CAMPAIGN_DETAIL_SELECT, CAMPAIGN_METADATA_SELECT } from '@/lib/campaignSelects';

export const revalidate = 60; // ISR: 1분마다 재생성


import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = getPublicServerClient();

    const { data: campaign } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_METADATA_SELECT)
        .eq('id', id)
        .single();

    const metadataCampaign = campaign as {
        title?: string | null;
        thumbnail_url?: string | null;
        campaign_options?: unknown;
    } | null;

    if (!metadataCampaign) return {};

    const campaignOptions = Array.isArray(metadataCampaign.campaign_options)
        ? metadataCampaign.campaign_options[0]
        : metadataCampaign.campaign_options;
    const step2Data = campaignOptions?.step2Data || {};

    const title = step2Data.campaignTitle || metadataCampaign.title;
    const description = '다온뷰 체험단 혜택 및 참여 가이드를 확인해보세요.';
    const thumbnail = metadataCampaign.thumbnail_url;

    return {
        title: `${title} | 다온뷰`,
        description,
        openGraph: {
            title: title,
            description,
            images: thumbnail ? [{ url: thumbnail }] : [],
            url: `https://daonview.com/campaigns/${id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description,
            images: thumbnail ? [thumbnail] : [],
        },
        alternates: {
            canonical: `/campaigns/${id}`,
        }
    };
}

export default async function CampaignDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = getPublicServerClient();

    // Fetch campaign data on the server
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_DETAIL_SELECT)
        .eq('id', id)
        .single();

    if (error || !campaign) {
        console.error('Campaign not found or error:', error);
        return notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            <CampaignDetailClient campaign={campaign} id={id} />
        </div>
    );
}
