import { createClient } from '@/lib/supabase/server';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import UnifiedAdminReviews from '@/components/admin/UnifiedAdminReviews';
import { getManagedReviewsForActor } from '@/lib/reviews/management';

export default async function AdminReviewsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const [initialReviews, sidebarCounts] = await Promise.all([
        user ? getManagedReviewsForActor(user.id) : Promise.resolve([]),
        fetchAdminCampaignCounts(supabase),
    ]);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="p-2 md:p-4">
                <UnifiedAdminReviews initialReviews={initialReviews} user={user} />
            </div>
        </AdminPageLayout>
    );
}
