import { getRequestAuth } from '@/lib/auth/requestAuth';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import ReviewUpdateClient from '@/components/admin/ReviewUpdateClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UpdateReviewsPage() {
    await requireDashboardRole('ADMIN');
    const { supabase, user } = await getRequestAuth();

    // 사이드바 카운트 가져오기
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="bg-gray-50 py-12">
                <ReviewUpdateClient />
            </div>
        </AdminPageLayout>
    );
}
