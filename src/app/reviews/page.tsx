import { createClient as createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ReviewsClient from './ReviewsClient';

export const revalidate = 60; // ISR: 1분마다 재생성

// 리뷰 데이터를 가져오는 비동기 함수
async function getReviews() {
    const supabase = await createServerClient();
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('id, post_url, platform, title, description, thumbnail_url, author_name, author_profile_url, is_featured, view_count, like_count, created_at')
        .eq('status', 'APPROVED')
        .limit(1000);

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
    return reviews || [];
}

export default async function ReviewsPage() {
    // Promise를 시작하되 await 하지 않고 클라이언트에 전달 (Streaming 가능하게)
    const reviewsPromise = getReviews();

    return <ReviewsClient reviewsPromise={reviewsPromise} />;
}
