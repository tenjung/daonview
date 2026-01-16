import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import CampaignTableClient from '@/components/CampaignTableClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

// Next.js 캐싱 비활성화 (매번 최신 데이터 가져오기)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function AdminCampaignsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const type = params.type || 'active';

    const getPageTitle = () => {
        switch (type) {
            case 'pending': return '요청중인 캠페인';
            case 'active': return '진행 중인 캠페인';
            case 'completed': return '완료된 캠페인';
            case 'upcoming': return '진행 예정 캠페인';
            default: return '캠페인 관리';
        }
    };

    // DB 쿼리 준비
    let campaignQuery = supabase
        .from('campaigns')
        .select(`
            *,
            applications(count),
            profiles:created_by (
                id,
                nickname,
                email,
                role,
                company_name
            )
        `)
        .order('created_at', { ascending: false });

    // Apply filters based on type
    if (type === 'pending') {
        campaignQuery = campaignQuery.eq('status', 'PENDING');
    } else if (type === 'upcoming') {
        campaignQuery = campaignQuery.eq('status', 'RECRUITING');
    } else if (type === 'active') {
        campaignQuery = campaignQuery.in('status', ['RECRUITING', 'ONGOING']);
    } else if (type === 'completed') {
        campaignQuery = campaignQuery.eq('status', 'COMPLETED');
    }

    // 병렬로 데이터 가져오기 (캠페인 목록 + 사이드바 카운트)
    const [campaignsRes, sidebarCounts] = await Promise.all([
        campaignQuery,
        fetchAdminCampaignCounts(supabase)
    ]);

    const data = campaignsRes.data || [];
    let campaigns = data;

    // 오늘 날짜를 YYYY-MM-DD 형식으로 (타임존 문제 해결)
    const today = new Date().toISOString().split('T')[0];

    // DB 필드 기반 날짜 필터링 (RECRUITING 상태 분리)
    if (type === 'upcoming') {
        // 진행전: RECRUITING 상태 + 시작일이 미래
        campaigns = campaigns.filter((cam: any) => {
            // recruitment_start_date가 없으면 created_at 사용
            const startDateStr = cam.recruitment_start_date || cam.created_at;
            // YYYY-MM-DD 형식으로 변환
            const startDate = startDateStr.split('T')[0];
            // 시작일이 오늘 이후인 경우만
            return startDate > today;
        });
    } else if (type === 'active') {
        // 진행중: (RECRUITING + 시작일 과거/오늘) 또는 ONGOING
        campaigns = campaigns.filter((cam: any) => {
            // ONGOING 상태는 무조건 포함
            if (cam.status === 'ONGOING') return true;

            // RECRUITING 상태는 시작일 체크
            if (cam.status === 'RECRUITING') {
                const startDateStr = cam.recruitment_start_date || cam.created_at;
                // YYYY-MM-DD 형식으로 변환
                const startDate = startDateStr.split('T')[0];
                // 시작일이 오늘 이전이거나 오늘인 경우
                return startDate <= today;
            }

            return false;
        });
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar initialCounts={sidebarCounts} />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                            <p className="text-gray-500 mt-1">
                                {type === 'pending' ? '새로 등록된 캠페인을 검토하고 승인하세요.' :
                                    type === 'active' ? '현재 실시간으로 모집 및 진행 중인 캠페인입니다.' :
                                        type === 'upcoming' ? '승인 완료되었으나 시작일이 남은 캠페인입니다.' :
                                            '종료된 캠페인 내역을 확인합니다.'}
                            </p>
                        </div>
                        <Link href="/dashboard/campaign/new" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">+ 캠페인 신규 등록</Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {getPageTitle()} 목록
                                <span className={`px-2 py-0.5 rounded-full text-xs ${type === 'pending' ? 'bg-rose-100 text-rose-600' :
                                    type === 'active' ? 'bg-green-100 text-green-600' :
                                        type === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {campaigns.length}
                                </span>
                            </h2>
                        </div>

                        <CampaignTableClient initialCampaigns={campaigns} type={type} />
                    </div>
                </div>
            </div>
        </div>
    );
}
