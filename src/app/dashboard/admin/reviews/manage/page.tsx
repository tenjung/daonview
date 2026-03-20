import { createClient } from '@/lib/supabase/server';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import ReviewManagementClient from '@/components/admin/ReviewManagementClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export default async function ManageReviewsPage() {
    const supabase = await createClient();

    // 병렬로 리뷰 목록과 사이드바 카운트 가져오기
    const [reviewsRes, sidebarCounts] = await Promise.all([
        supabase
            .from('reviews')
            .select('id, post_url, platform, title, author_name, thumbnail_url, status, created_at, user_id')
            .order('created_at', { ascending: false }),
        fetchAdminCampaignCounts(supabase)
    ]);

    const reviews = reviewsRes.data || [];

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <ReviewManagementClient initialReviews={reviews} />
        </AdminPageLayout>
    );
}
