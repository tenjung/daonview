import type { Metadata } from 'next';
import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { unstable_cache } from 'next/cache';
import ReviewsClient from './ReviewsClient';

export const metadata: Metadata = {
  title: '리뷰 모아보기',
  description: '다온뷰 체험단 참여자들의 실제 후기와 리뷰 사례를 모아보고 플랫폼 운영 결과를 확인하세요.',
  keywords: ['체험단 후기', '체험단 리뷰', '블로그 후기', '인스타그램 후기', '리뷰 사례', '다온뷰 리뷰'],
  openGraph: {
    title: '리뷰 모아보기 | 다온뷰',
    description: '다온뷰 체험단 참여자들의 실제 후기와 리뷰 사례를 모아보고 플랫폼 운영 결과를 확인하세요.',
    url: 'https://daonview.com/reviews',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
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
