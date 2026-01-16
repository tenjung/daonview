import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import AdminSidebar from '@/components/AdminSidebar';
import ReviewManagementClient from '@/components/admin/ReviewManagementClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export default async function ManageReviewsPage() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Component
                    }
                },
            },
        }
    );

    // 병렬로 리뷰 목록과 사이드바 카운트 가져오기
    const [reviewsRes, sidebarCounts] = await Promise.all([
        supabase
            .from('reviews')
            .select('id, review_url, platform, title, author_name, thumbnail_url, status, created_at')
            .order('created_at', { ascending: false }),
        fetchAdminCampaignCounts(supabase)
    ]);

    const reviews = reviewsRes.data || [];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar initialCounts={sidebarCounts} />
            <ReviewManagementClient initialReviews={reviews} />
        </div>
    );
}
