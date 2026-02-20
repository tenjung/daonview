import { supabase } from '@/lib/supabase/client';
import { UnifiedAdminCampaigns } from '@/components/admin/UnifiedAdminCampaigns';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import AdminPageLayout from '@/components/admin/AdminPageLayout';

// Next.js 캐싱 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCampaignsPage() {
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-primary" />
                        캠페인 통합 관리
                    </h1>
                    <p className="text-gray-500 mt-1">
                        모든 상태의 캠페인을 한곳에서 쉽고 빠르게 관리하세요.
                    </p>
                </div>
                <Link 
                    href="/dashboard/campaign/new" 
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                >
                    + 신규 캠페인 등록
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <UnifiedAdminCampaigns initialData={campaignsRes || []} />
            </div>
        </AdminPageLayout>
    );
}
