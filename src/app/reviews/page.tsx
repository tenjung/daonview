import { createClient as createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ReviewsClient from './ReviewsClient';

export const revalidate = 60; // ISR: 1분마다 재생성

export default async function ReviewsPage() {
    const supabase = await createServerClient();

    // 승인된 리뷰 가져오기 (초기 20개만)
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('id, post_url, platform, title, description, thumbnail_url, author_name, author_profile_url, is_featured, view_count, like_count, created_at')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(20); // 초기 20개만 로드


    if (error) {
        console.error('Error fetching reviews:', error);
        return <ReviewsClient reviews={[]} />;
    }

    return <ReviewsClient reviews={reviews || []} />;
}
