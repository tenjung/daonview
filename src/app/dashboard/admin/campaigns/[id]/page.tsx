import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ApplicationsTableClient from '@/components/admin/ApplicationsTableClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { Badge } from '@/components/ui/badge';
import { Application } from '@/types/database';
import { getCampaignRecruitTarget } from '@/lib/campaignUtils';
import { getManagedReviewsForActor } from '@/lib/reviews/management';
import { getCampaignEmailHolds } from '@/lib/selectionEmailHoldServer';

// Next.js 캐싱 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CampaignApplicationsPage({ params }: PageProps) {
    const { userId } = await requireDashboardRole('ADMIN');
    // 관리자 확인(requireDashboardRole) 후에만 서버 권한으로 신청자 연락처를 포함해 조회한다.
    const supabase = createAdminClient();
    const { id } = await params;

    // 캠페인 정보, 신청자 목록, 사이드바 카운트 병렬 조회
    const [campaignRes, applicationsRes, sidebarCounts] = await Promise.all([
        supabase
            .from('campaigns')
            .select(`
                *,
                profiles:created_by (
                    id,
                    nickname,
                    email,
                    company_name
                )
            `)
            .eq('id', id)
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
        fetchAdminCampaignCounts(supabase)
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
    const [emailHolds, campaignReviews] = await Promise.all([
        getCampaignEmailHolds(Number(campaign.id)),
        getManagedReviewsForActor(userId, undefined, { campaignId: Number(campaign.id) }),
    ]);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            {/* 헤더 */}
            <DashboardPageHeader
                eyebrow={
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/dashboard/admin/campaigns"
                            className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors gap-1 w-fit"
                        >
                            <ArrowLeft size={16} />
                            목록으로 돌아가기
                        </Link>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                                {campaign.category}
                            </Badge>
                            <span className="text-gray-400 text-sm">ID: {campaign.id}</span>
                        </div>
                    </div>
                }
                title={campaign.title}
            />

            {/* 메인 테이블 영역 */}
            <ApplicationsTableClient
                initialApplications={applications}
                initialEmailHolds={emailHolds.holds}
                initialKakaoDeliveries={emailHolds.kakaoDeliveries}
                initialReviews={campaignReviews}
                canResolveEmailHolds={emailHolds.canResolve}
                campaignId={campaign.id}
                campaignTitle={campaign.title}
                campaignCategory={campaign.category || ''}
                campaignType={campaign.type}
                campaignProductName={campaignProductName}
                productUrlIndividual={productUrlIndividual}
                recruitCount={getCampaignRecruitTarget(campaign) || 0}
            />
        </AdminPageLayout>
    );
}
