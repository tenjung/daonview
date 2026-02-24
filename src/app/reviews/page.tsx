import type { Metadata } from 'next';
import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { unstable_cache } from 'next/cache';
import ReviewsClient from './ReviewsClient';

export const metadata: Metadata = {
  title: '리뷰 모아보기',
  description: '다온뷰 체험단에 참가한 인플루언서들의 실제 리뷰를 모아보세요. 블로그, 인스타그램, 유튜브 수십만 리뷰어 전원 리뷰 모음.',
  keywords: ['체험단 리뷰', '블로그 체험단 후기', '인스타 체험단 후기', '유튜브 리뷰', '다온뷰 후기', '인플루언서 리뷰'],
  openGraph: {
    title: '리뷰 모아보기 | 다온뷰',
    description: '다온뷰 체험단에 참가한 인플루언서들의 실제 리뷰를 모아보세요.',
    url: 'https://daonview.com/reviews',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/reviews',
  },
};

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
