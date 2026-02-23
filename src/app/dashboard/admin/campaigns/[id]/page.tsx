import { supabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BadgeHelp } from 'lucide-react';
import ApplicationsTableClient from '@/components/admin/ApplicationsTableClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { Badge } from '@/components/ui/badge';

// Next.js 캐싱 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CampaignApplicationsPage({ params }: PageProps) {
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
    const applications = applicationsRes.data || [];

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
                initialApplications={applications as any}
                campaignId={campaign.id}
                campaignTitle={campaign.title}
                campaignCategory={campaign.category || ''}
                campaignType={campaign.type}
                recruitCount={campaign.recruit_count || 0}
            />
        </AdminPageLayout>
    );
}
