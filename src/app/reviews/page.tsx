import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { unstable_cache } from 'next/cache';
import ReviewsClient from './ReviewsClient';

const WEEKLY_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

const getWeeklyReviewSnapshot = unstable_cache(async () => {
    const supabase = getPublicServerClient();
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('id, post_url, platform, title, description, thumbnail_url, author_name, author_profile_url, is_featured, view_count, like_count, created_at')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
    return reviews || [];
}, ['reviews-weekly-snapshot-v1'], {
    revalidate: WEEKLY_REVALIDATE_SECONDS,
    tags: ['reviews-snapshot'],
});

export default async function ReviewsPage() {
    const reviewsPromise = getWeeklyReviewSnapshot();

    return <ReviewsClient reviewsPromise={reviewsPromise} />;
}
