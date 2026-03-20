import { createClient } from '@/lib/supabase/server';
import { UnifiedAdminCampaigns } from '@/components/admin/UnifiedAdminCampaigns';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';

// Next.js 캐싱 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCampaignsPage() {
    await requireDashboardRole('ADMIN');
    const supabase = await createClient();

    // 모든 캠페인 데이터 가져오기 (관리자는 전체를 봐야 하므로 필터 최소화)
    const { data: campaignsRes, error } = await supabase
        .from('campaigns')
        .select(`
            *,
            applications(count),
            advertiser:profiles!campaigns_created_by_fkey (
                id,
                nickname,
                email,
                role,
                company_name
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching campaigns:', error);
    }

    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-8 px-4 sm:px-0">
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                        <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        캠페인 통합 관리
                    </h1>
                    <p className="text-gray-500 mt-1 text-xs sm:text-sm">
                        모든 상태의 캠페인을 한곳에서 쉽고 빠르게 관리하세요.
                    </p>
                </div>
                <Link 
                    href="/dashboard/campaign/new" 
                    className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 sm:py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                    + 신규 캠페인 등록
                </Link>
            </div>

            <div className="bg-transparent sm:bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-sm border-none sm:border sm:border-gray-200 p-0 sm:p-6">
                <UnifiedAdminCampaigns initialData={campaignsRes || []} />
            </div>
        </AdminPageLayout>
    );
}
