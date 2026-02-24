'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, EyeOff, Search, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { sendReviewApprovedAlimtalk } from '@/lib/alimtalk';

interface Review {
    id: string;
    post_url: string;
    platform: string;
    title: string | null;
    author_name: string | null;
    thumbnail_url: string | null;
    status: string;
    created_at: string;
    user_id: string;
}

interface ReviewManagementClientProps {
    initialReviews: Review[];
}

export default function ReviewManagementClient({ initialReviews }: ReviewManagementClientProps) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [filteredReviews, setFilteredReviews] = useState<Review[]>(initialReviews);
    const [filter, setFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 리뷰 목록 가져오기 (수동 새로고침용)
    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('id, post_url, platform, title, author_name, thumbnail_url, status, created_at, user_id')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error: any) {
            console.error('Error fetching reviews:', error);
            toast.error('리뷰 목록을 불러오는데 실패했습니다');
        } finally {
            setIsLoading(false);
        }
    };

    // 필터링 및 검색
    useEffect(() => {
        let filtered = reviews;

        // 상태 필터
        if (filter !== 'ALL') {
            filtered = filtered.filter(r => r.status === filter);
        }

        // 검색
        if (searchQuery) {
            filtered = filtered.filter(r =>
                r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.post_url.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredReviews(filtered);
    }, [filter, searchQuery, reviews]);

    // 상태 변경 (승인/숨김/복원)
    const handleStatusChange = async (reviewId: string, newStatus: string, reviewData?: Review) => {
        try {
            const response = await fetch('/api/hide-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewId,
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('상태 변경 실패');
            }

            // 승인됨(APPROVED)으로 변경된 경우 인플루언서에게 알림톡 발송
            if (newStatus === 'APPROVED' && reviewData && reviewData.user_id) {
                console.log('Sending approval alimtalk for review:', reviewId);

                // 인플루언서 정보 조회
                const { data: userData } = await supabase
                    .from('profiles')
                    .select('phone_number, nickname, name')
                    .eq('id', reviewData.user_id)
                    .single();

                if (userData?.phone_number) {
                    await sendReviewApprovedAlimtalk(
                        userData.phone_number,
                        userData.nickname || userData.name || '인플루언서',
                        reviewData.title || '캠페인 리뷰'
                    );
                }
            }

            toast.success(
                newStatus === 'HIDDEN' ? '리뷰를 숨겼습니다' :
                    newStatus === 'APPROVED' ? '리뷰를 승인했습니다' :
                        newStatus === 'REJECTED' ? '리뷰를 거절했습니다' : '상태를 변경했습니다'
            );
            fetchReviews(); // 목록 새로고침
        } catch (error: any) {
            console.error('Error changing status:', error);
            toast.error('상태 변경에 실패했습니다');
        }
    };

    const getPlatformIcon = (platform: string) => {
        const normalizedPlatform = String(platform || '').toUpperCase();
        switch (normalizedPlatform) {
            case 'BLOG':
            case 'NAVER_BLOG':
                return '📝';
            case 'INSTAGRAM': return '📷';
            case 'YOUTUBE': return '🎥';
            case 'TIKTOK': return '🎵';
            default: return '🔗';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-500">✅ 승인됨</Badge>;
            case 'HIDDEN':
                return <Badge className="bg-gray-500">🚫 숨김</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-500">⏳ 대기중</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-500">❌ 거부됨</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="flex-1">
            <div className="mx-auto px-0">
                {/* 필터 및 검색 */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* 상태 필터 */}
                        <div className="flex gap-2 flex-wrap">
                            {['ALL', 'APPROVED', 'HIDDEN', 'PENDING', 'REJECTED'].map((status) => (
                                <Button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    variant={filter === status ? 'default' : 'outline'}
                                    className="h-10"
                                >
                                    {status === 'ALL' ? '전체' :
                                        status === 'APPROVED' ? '승인됨' :
                                            status === 'HIDDEN' ? '숨김' :
                                                status === 'PENDING' ? '대기중' : '거부됨'}
                                </Button>
                            ))}
                        </div>

                        {/* 검색 */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="제목, 작성자, URL 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* 새로고침 */}
                        <Button
                            onClick={fetchReviews}
                            variant="outline"
                            className="h-10"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* 통계 */}
                    <div className="mt-4 flex gap-4 text-sm text-gray-600">
                        <span>전체: <strong>{reviews.length}</strong></span>
                        <span>승인: <strong>{reviews.filter(r => r.status === 'APPROVED').length}</strong></span>
                        <span>숨김: <strong>{reviews.filter(r => r.status === 'HIDDEN').length}</strong></span>
                        <span>검색 결과: <strong>{filteredReviews.length}</strong></span>
                    </div>
                </div>

                {/* 리뷰 목록 */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                        <p className="mt-4 text-gray-500">로딩 중...</p>
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
                        <p className="text-gray-500">리뷰가 없습니다</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-rose-200 transition-colors"
                            >
                                <div className="flex gap-4">
                                    {/* 썸네일 */}
                                    {review.thumbnail_url && (
                                        <img
                                            src={review.thumbnail_url}
                                            alt={review.title || '썸네일'}
                                            className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                                            referrerPolicy="no-referrer"
                                        />
                                    )}

                                    {/* 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{getPlatformIcon(review.platform)}</span>
                                                <span className="text-sm text-gray-500">{review.platform}</span>
                                                <span className="text-sm text-gray-400">|</span>
                                                <span className="text-sm font-medium">{review.author_name || '작성자 없음'}</span>
                                                <span className="text-sm text-gray-400">|</span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString('ko-KR')}
                                                </span>
                                            </div>
                                            {getStatusBadge(review.status)}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                                            {review.title || '제목 없음'}
                                        </h3>

                                        <a
                                            href={review.post_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            {review.post_url}
                                        </a>

                                        {/* 액션 버튼 */}
                                        <div className="flex gap-2">
                                            {review.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        onClick={() => handleStatusChange(review.id, 'APPROVED', review)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-700 border-green-200 hover:bg-green-50"
                                                    >
                                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                                        승인하기
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleStatusChange(review.id, 'REJECTED', review)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-rose-700 border-rose-200 hover:bg-rose-50"
                                                    >
                                                        <EyeOff className="w-4 h-4 mr-2" />
                                                        거절하기
                                                    </Button>
                                                </>
                                            )}
                                            {review.status === 'APPROVED' && (
                                                <Button
                                                    onClick={() => handleStatusChange(review.id, 'HIDDEN', review)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-gray-700 hover:bg-gray-100"
                                                >
                                                    <EyeOff className="w-4 h-4 mr-2" />
                                                    숨기기
                                                </Button>
                                            )}
                                            {review.status === 'HIDDEN' && (
                                                <Button
                                                    onClick={() => handleStatusChange(review.id, 'APPROVED', review)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-700 hover:bg-green-50"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    복원하기
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
