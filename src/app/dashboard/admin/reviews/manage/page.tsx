import { getRequestAuth } from '@/lib/auth/requestAuth';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { createClient } from '@/lib/supabase/server';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import ReviewManagementClient from '@/components/admin/ReviewManagementClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import { getManagedReviewsForActor } from '@/lib/reviews/management';

export default async function ManageReviewsPage() {
    await requireDashboardRole('ADMIN');
    const supabase = await createClient();

    const { user } = await getRequestAuth();
    const [reviews, sidebarCounts] = await Promise.all([
        user ? getManagedReviewsForActor(user.id) : Promise.resolve([]),
        fetchAdminCampaignCounts(supabase),
    ]);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <ReviewManagementClient initialReviews={reviews} />
        </AdminPageLayout>
    );
}
