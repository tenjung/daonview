'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, Eye, ThumbsUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';

interface Review {
    id: string;
    post_url: string;
    platform: string;
    title: string | null;
    description: string | null;
    thumbnail_url: string | null;
    author_name: string | null;
    author_profile_url: string | null;
    is_featured: boolean;
    view_count: number;
    like_count: number;
    created_at: string;
}

interface ReviewsClientProps {
    reviews: Review[];
}

// 플랫폼별 아이콘 및 색상
const platformConfig = {
    NAVER_BLOG: {
        icon: '📝',
        label: '네이버 블로그',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50'
    },
    INSTAGRAM: {
        icon: '📷',
        label: '인스타그램',
        color: 'bg-pink-500',
        textColor: 'text-pink-700',
        bgColor: 'bg-pink-50'
    },
    YOUTUBE: {
        icon: '🎥',
        label: '유튜브',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50'
    },
    TIKTOK: {
        icon: '🎵',
        label: '틱톡',
        color: 'bg-black',
        textColor: 'text-gray-900',
        bgColor: 'bg-gray-50'
    },
    OTHER: {
        icon: '🔗',
        label: '기타',
        color: 'bg-gray-500',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50'
    }
};

// 네이버 블로그 ID 추출 함수
function extractNaverBlogInfo(url: string) {
    const match = url.match(/blog\.naver\.com\/([^\/]+)\/(\d+)/);
    if (match) {
        return {
            blogId: match[1],
            postId: match[2]
        };
    }
    return null;
}

export default function ReviewsClient({ reviews }: ReviewsClientProps) {
    const { profile } = useAuthStore();
    const [filter, setFilter] = useState<string>('ALL');
    const [shuffledReviews, setShuffledReviews] = useState<Review[]>([]);
    const [displayedCount, setDisplayedCount] = useState(12); // 초기 12개만 표시
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 페이지 진입 시 리뷰를 랜덤으로 섞기
    useEffect(() => {
        const shuffled = [...reviews].sort(() => Math.random() - 0.5);
        setShuffledReviews(shuffled);
    }, [reviews]);

    // 필터링된 리뷰
    const filteredReviews = filter === 'ALL' 
        ? shuffledReviews 
        : shuffledReviews.filter(r => r.platform === filter);

    // 표시할 리뷰 (무한 스크롤)
    const displayedReviews = filteredReviews.slice(0, displayedCount);
    const hasMore = displayedCount < filteredReviews.length;

    // 무한 스크롤 - Intersection Observer
    useEffect(() => {
        if (!loadMoreRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    
                    // 0.5초 후 12개 추가 로드 (자연스러운 로딩)
                    setTimeout(() => {
                        setDisplayedCount(prev => prev + 12);
                        setIsLoadingMore(false);
                    }, 500);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, displayedCount]);

    // 필터 변경 시 표시 개수 초기화
    useEffect(() => {
        setDisplayedCount(12);
    }, [filter]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="container py-12 md:py-20 max-w-[1400px] mx-auto px-4">
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-full text-sm font-bold mb-4">
                        <Sparkles className="w-4 h-4" />
                        인플루언서 베스트 리뷰
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                        생생한 체험 후기
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        다온뷰 인플루언서들이 직접 작성한 진솔한 리뷰를 만나보세요
                    </p>
                </div>

                {/* 필터 탭 */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {['ALL', 'NAVER_BLOG', 'INSTAGRAM', 'YOUTUBE'].map((platform) => (
                        <button
                            key={platform}
                            onClick={() => setFilter(platform)}
                            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                                filter === platform
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            {platform === 'ALL' ? '전체' : platformConfig[platform as keyof typeof platformConfig].label}
                        </button>
                    ))}
                </div>

                {/* 역할별 액션 버튼 */}
                {profile && (
                    <div className="mb-8 flex justify-end gap-3">
                        {profile.role === 'ADMIN' && (
                            <>
                                <Link
                                    href="/dashboard/admin/reviews/update"
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                                >
                                    🔄 리뷰 업데이트
                                </Link>
                                <Link
                                    href="/dashboard/admin/reviews/manage"
                                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                                >
                                    ⚙️ 리뷰 관리
                                </Link>
                                <Link
                                    href="/dashboard/admin/reviews/new"
                                    className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                                >
                                    ✨ 리뷰 등록하기
                                </Link>
                            </>
                        )}
                        {profile.role === 'INFLUENCER' && (
                            <Link
                                href="/dashboard/influencer"
                                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                            >
                                ✍️ 내 리뷰 등록하기
                            </Link>
                        )}
                    </div>
                )}

                {/* 리뷰 그리드 */}
                {displayedReviews.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-400 text-lg font-medium">등록된 리뷰가 없습니다</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayedReviews.map((review) => {
                                const config = platformConfig[review.platform as keyof typeof platformConfig];
                                const blogInfo = review.platform === 'NAVER_BLOG' ? extractNaverBlogInfo(review.post_url) : null;
                                
                                return (
                                    <a
                                        key={review.id}
                                        href={review.post_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-rose-200 transition-all duration-300 transform hover:-translate-y-2"
                                    >
                                    {/* 썸네일 영역 */}
                                    <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                                        {review.thumbnail_url ? (
                                            <img
                                                src={review.thumbnail_url}
                                                alt={review.title || '리뷰 썸네일'}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl">
                                                {config.icon}
                                            </div>
                                        )}
                                        
                                        {/* BEST 뱃지 */}
                                        {review.is_featured && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                                                ⭐ BEST
                                            </div>
                                        )}

                                        {/* 외부 링크 아이콘 */}
                                        <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-5 h-5 text-gray-700" />
                                        </div>
                                    </div>

                                    {/* 콘텐츠 영역 */}
                                    <div className="p-6">
                                        {/* 작성자 정보 */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                                                {config.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {review.author_name || blogInfo?.blogId || '익명'}
                                                </p>
                                                <p className={`text-xs font-medium ${config.textColor}`}>
                                                    {config.label}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 제목 */}
                                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">
                                            {review.title || '제목 없음'}
                                        </h3>

                                        {/* 설명 */}
                                        {review.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                                {review.description}
                                            </p>
                                        )}

                                        {/* 하단 메타 정보 */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {review.view_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    {review.like_count}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(review.created_at).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                }).replace(/\. /g, '.').replace(/\.$/, '')}
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>

                    {/* 무한 스크롤 로딩 인디케이터 */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="py-12 text-center">
                            <div className="inline-flex items-center gap-3 text-gray-400">
                                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <p className="text-sm text-gray-400 mt-3">더 많은 리뷰 불러오는 중...</p>
                        </div>
                    )}

                    {/* 모든 리뷰 로드 완료 */}
                    {!hasMore && displayedReviews.length > 0 && (
                        <div className="py-12 text-center">
                            <div className="text-4xl mb-3">🎉</div>
                            <p className="text-gray-400 font-medium">모든 리뷰를 확인했습니다</p>
                            <p className="text-sm text-gray-400 mt-1">총 {displayedReviews.length}개의 리뷰</p>
                        </div>
                    )}
                </>
                )}
            </div>
        </div>
    );
}
