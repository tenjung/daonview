import { supabase } from '@/lib/supabaseClient';
import CampaignDetailClient from '@/components/CampaignDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 60; // ISR: 1분마다 재생성


import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

    if (!campaign) return {};

    const campaignOptions = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
    const step2Data = campaignOptions?.step2Data || {};
    const step1Data = campaignOptions?.step1Data || {};
    
    const title = step2Data.campaignTitle || campaign.title;
    const description = campaign.description || campaign.experience_details || step1Data.experienceDetails || '';
    const thumbnail = campaign.thumbnail_url;

    return {
        title: `${title} | 다온뷰`,
        description: description.substring(0, 160),
        openGraph: {
            title: title,
            description: description.substring(0, 160),
            images: thumbnail ? [{ url: thumbnail }] : [],
            url: `https://daonview.com/campaigns/${id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description.substring(0, 160),
            images: thumbnail ? [thumbnail] : [],
        }
    };
}

export default async function CampaignDetailPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch campaign data on the server
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
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
