import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/AdminSidebar';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import UnifiedAdminReviews from '@/components/admin/UnifiedAdminReviews';

export default async function AdminReviewsPage() {
    const supabase = await createClient();

    // 병렬로 초기 리뷰 목록과 사이드바 카운트 가져오기
    const [reviewsRes, sidebarCounts, { data: { user } }] = await Promise.all([
        supabase
            .from('reviews')
            .select('id, post_url, platform, title, author_name, thumbnail_url, status, created_at, user_id')
            .order('created_at', { ascending: false }),
        fetchAdminCampaignCounts(supabase),
        supabase.auth.getUser()
    ]);

    const initialReviews = reviewsRes.data || [];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar initialCounts={sidebarCounts} />
            <main className="flex-1 bg-gray-50/50 p-6 md:p-8 overflow-y-auto">
                <UnifiedAdminReviews initialReviews={initialReviews} user={user} />
            </main>
        </div>
    );
}
