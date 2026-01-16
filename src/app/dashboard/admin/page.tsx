import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabaseClient';
import AdminDashboardClient from '@/components/AdminDashboardClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export default async function AdminDashboard() {
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
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'ADVERTISER'),

        // 2. 인플루언서 수
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'INFLUENCER'),

        // 3. 오늘 생성된 캠페인 수
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),

        // 4. 승인 대기 중인 캠페인 수
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),

        // 5. 모집 중/진행 중 캠페인 상세 (위험 분석용)
        supabase.from('campaigns').select(`
            *,
            applications(count),
            profiles:created_by(id, email, name, company_name, role)
        `)
            .in('status', ['RECRUITING', 'ONGOING'])
            .order('end_date', { ascending: true }),
        
        // 6. 사이드바 카운트 (SSR용)
        fetchAdminCampaignCounts(supabase)
    ]);

    const stats = {
        totalAdvertisers: advertiserRes.count || 0,
        totalInfluencers: influencerRes.count || 0,
        todayCampaigns: todayCampaignRes.count || 0,
        pendingApprovals: pendingCampaignRes.count || 0,
    };

    const campaigns = campaignsRes.data || [];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar initialCounts={sidebarCounts} />

            <main className="flex-1 p-10 overflow-y-auto bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">슈퍼 어드민 관리페이지</h1>
                        <p className="text-gray-500 mt-1">실시간 데이터 기반으로 성과를 확인하고 문제를 해결합니다</p>
                    </div>
                    <Link href="/dashboard/campaign/new" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">+ 캠페인 강제 등록</Link>
                </div>

                {/* Section A: 최상단 현황판 (Global KPI) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link
                        href="/admin/users?tab=ADVERTISER"
                        className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">총 회원수 (기업)</div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <span className="text-xl">🏢</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                            {stats.totalAdvertisers.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">광고주 계정</div>
                    </Link>

                    <Link
                        href="/admin/users?tab=INFLUENCER"
                        className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500 group-hover:text-purple-600 transition-colors">총 회원수 (인플)</div>
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <span className="text-xl">⭐</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-purple-600">
                            {stats.totalInfluencers.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">인플루언서 계정</div>
                    </Link>

                    <Link
                        href="/dashboard/admin/campaigns"
                        className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500 group-hover:text-green-600 transition-colors">오늘 신규 캠페인</div>
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                <span className="text-xl">📢</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-green-600">{stats.todayCampaigns}</div>
                        <div className="text-xs text-gray-400 mt-1">오늘 등록된 캠페인</div>
                    </Link>

                    <Link
                        href="/dashboard/admin/campaigns?type=pending"
                        className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500 group-hover:text-orange-600 transition-colors">대기중인 승인 요청</div>
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                <span className="text-xl">⏰</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</div>
                        <div className="text-xs text-gray-400 mt-1">승인 대기 중</div>
                    </Link>
                </div>

                <AdminDashboardClient initialCampaigns={campaigns} />
            </main>
        </div>
    );
}
