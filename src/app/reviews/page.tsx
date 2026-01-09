import { createServerClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient();

    // 승인된 리뷰 가져오기 (profiles 조인 제거)
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return <ReviewsClient reviews={[]} />;
    }

    return <ReviewsClient reviews={reviews || []} />;
}
