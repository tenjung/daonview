import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import type { Application } from '@/types/database';
import CampaignApplicationsClient from './CampaignApplicationsClient';
import { getCampaignRecruitTarget } from '@/lib/campaignUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdvertiserCampaignApplicationsPage({ params }: PageProps) {
    const supabase = await createClient();
    const { id } = await params;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?returnTo=/dashboard/advertiser/campaigns');
    }

    const [campaignRes, applicationsRes] = await Promise.all([
        supabase
            .from('campaigns')
            .select('id, title, category, type, product_name, total_recruitment, created_by, campaign_options')
            .eq('id', id)
            .eq('created_by', user.id)
            .single(),
        supabase
            .from('applications')
            .select(`
                *,
                user:profiles!applications_user_id_fkey (
                    id,
                    nickname,
                    name,
                    email,
                    phone_number,
                    sns_url,
                    avatar_url
                ),
                campaigns:campaign_id (
                    id,
                    title,
                    type,
                    category
                )
            `)
            .eq('campaign_id', id)
            .order('created_at', { ascending: false }),
    ]);

    const campaign = campaignRes.data;
    const applications: Application[] = (applicationsRes.data || []) as Application[];
    const campaignOptions = Array.isArray(campaign?.campaign_options)
        ? campaign.campaign_options[0]
        : campaign?.campaign_options;
    const productUrlIndividual = Boolean(campaignOptions?.step1Data?.productUrlIndividual);
    const campaignProductName =
        campaign?.product_name ||
        campaignOptions?.step1Data?.productName ||
        '';

    if (campaignRes.error || !campaign) {
        notFound();
    }

    return (
        <CampaignApplicationsClient
            campaignId={String(campaign.id)}
            campaignNumericId={campaign.id}
            campaignTitle={campaign.title}
            campaignCategory={campaign.category || ''}
            campaignType={campaign.type || ''}
            campaignProductName={campaignProductName}
            productUrlIndividual={productUrlIndividual}
            recruitCount={getCampaignRecruitTarget(campaign) || 0}
            initialApplications={applications}
        />
    );
}
