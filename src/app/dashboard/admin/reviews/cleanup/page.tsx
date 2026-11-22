import { getRequestAuth } from '@/lib/auth/requestAuth';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import DuplicateCleanupClient from '@/components/admin/DuplicateCleanupClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export default async function DuplicateCleanupPage() {
    await requireDashboardRole('ADMIN');
    const { supabase, user } = await getRequestAuth();

    // 사이드바 카운트 가져오기
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="py-12">
                <DuplicateCleanupClient />
            </div>
        </AdminPageLayout>
    );
}
