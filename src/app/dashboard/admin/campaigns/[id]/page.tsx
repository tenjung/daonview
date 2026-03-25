import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ApplicationsTableClient from '@/components/admin/ApplicationsTableClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { Badge } from '@/components/ui/badge';
import { Application } from '@/types/database';
import { getCampaignRecruitTarget } from '@/lib/campaignUtils';

// Next.js 캐싱 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CampaignApplicationsPage({ params }: PageProps) {
    const supabase = await createClient();
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

    const campaignProvidedItems =
        campaign?.provision ||
        campaign?.experience_details ||
        campaign?.product_name ||
        '';

    const campaignDeadlineDate = campaign?.end_date
        ? new Intl.DateTimeFormat('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(campaign.end_date))
        : '';

    if (campaignRes.error || !campaign) {
        notFound();
    }

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            {/* 헤더 */}
            <div className="mb-6">
                <Link
                    href="/dashboard/admin/campaigns"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors gap-1 mb-4 w-fit"
                >
                    <ArrowLeft size={16} />
                    목록으로 돌아가기
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                                {campaign.category}
                            </Badge>
                            <span className="text-gray-400 text-sm">ID: {campaign.id}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                            {campaign.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* 메인 테이블 영역 */}
            <ApplicationsTableClient
                initialApplications={applications}
                campaignId={campaign.id}
                campaignTitle={campaign.title}
                campaignProvidedItems={campaignProvidedItems}
                campaignDeadlineDate={campaignDeadlineDate}
                campaignCategory={campaign.category || ''}
                campaignType={campaign.type}
                productUrlIndividual={productUrlIndividual}
                recruitCount={getCampaignRecruitTarget(campaign) || 0}
            />
        </AdminPageLayout>
    );
}
