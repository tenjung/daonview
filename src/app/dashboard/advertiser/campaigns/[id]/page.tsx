import { getRequestAuth } from '@/lib/auth/requestAuth';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound, redirect } from 'next/navigation';
import type { Application } from '@/types/database';
import CampaignApplicationsClient from './CampaignApplicationsClient';
import { getCampaignRecruitTarget } from '@/lib/campaignUtils';
import { getManagedReviewsForActor } from '@/lib/reviews/management';
import { getCampaignEmailHolds } from '@/lib/selectionEmailHoldServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdvertiserCampaignApplicationsPage({ params }: PageProps) {
    await requireDashboardRole('ADVERTISER');
    const supabase = await createClient();
    const { id } = await params;

    const { user } = await getRequestAuth();

    if (!user) {
        redirect('/login?returnTo=/dashboard/advertiser/campaigns');
    }

    const campaignRes = await supabase
        .from('campaigns')
        .select('id, title, category, type, product_name, total_recruitment, created_by, campaign_options')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();

    // 신청자 연락처(이메일·전화번호)는 내 캠페인임을 확인한 뒤에만 서버 권한으로 조회한다.
    const applicationsRes = campaignRes.data
        ? await createAdminClient()
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
            .order('created_at', { ascending: false })
        : { data: [] as Application[], error: null };

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
    const [emailHolds, campaignReviews] = await Promise.all([
        getCampaignEmailHolds(Number(campaign.id)),
        getManagedReviewsForActor(user.id, undefined, { campaignId: Number(campaign.id) }),
    ]);

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
            initialEmailHolds={emailHolds.holds}
            initialReviews={campaignReviews}
            canResolveEmailHolds={emailHolds.canResolve}
        />
    );
}
