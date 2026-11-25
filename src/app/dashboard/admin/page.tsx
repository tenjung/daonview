import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminDashboardClient from '@/components/AdminDashboardClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import { LayoutDashboard } from 'lucide-react';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';

export default async function AdminDashboard() {
    await requireDashboardRole('ADMIN');
    // 관리자 확인(requireDashboardRole) 후에만 서버 권한으로 회원 연락처를 포함해 조회한다.
    const supabase = createAdminClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 모든 데이터를 병렬로 요청하여 속도 향상
    const [
        advertiserRes,
        influencerRes,
        todayCampaignRes,
        pendingCampaignRes,
        campaignsRes,
        sidebarCounts
    ] = await Promise.all([
        // 1. 광고주 수
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'ADVERTISER').eq('is_test_account', false),

        // 2. 인플루언서 수
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'INFLUENCER').eq('is_test_account', false),

        // 3. 오늘 생성된 캠페인 수
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),

        // 4. 승인 대기 중인 캠페인 수
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),

        // 5. 모집 중/진행 중 캠페인 상세 (위험 분석용)
        supabase.from('campaigns').select(`
            *,
            applications(count),
            profiles:created_by(id, email, nickname, company_name, role)
        `)
            .in('status', ['RECRUITING', 'ONGOING'])
            .order('end_date', { ascending: true }),

        // 6. 사이드바 카운트 (SSR용)
        fetchAdminCampaignCounts(supabase)
    ]);

    if ([advertiserRes, influencerRes, todayCampaignRes, pendingCampaignRes, campaignsRes].some(result => result.error)) {
        throw new Error('관리자 대시보드 데이터를 불러오지 못했습니다.');
    }
    const statsData = {
        totalAdvertisers: advertiserRes.count || 0,
        totalInfluencers: influencerRes.count || 0,
        todayCampaigns: todayCampaignRes.count || 0,
        pendingApprovals: pendingCampaignRes.count || 0,
    };

    const campaigns = campaignsRes.data || [];

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2 sm:gap-3 tracking-tight">
                        <LayoutDashboard className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
                        Admin Insight
                    </h1>
                    <p className="text-gray-500 mt-1 sm:mt-1.5 font-medium text-xs sm:text-sm">
                        실시간 플랫폼 상태와 위험 요소를 한눈에 모니터링합니다.
                    </p>
                </div>
                <Link
                    href="/dashboard/campaign/new"
                    className="bg-gray-900 text-white w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                >
                    + 신규 캠페인 등록
                </Link>
            </div>

            {/* 통합 현황 타일 + 위젯 및 모니터링 */}
            <div className="space-y-6">
                <AdminDashboardClient initialCampaigns={campaigns} stats={statsData} />
            </div>
        </AdminPageLayout>
    );
}
