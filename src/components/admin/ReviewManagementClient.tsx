'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReviewDetailCard } from '@/components/reviews/ReviewDetailCard';
import { REVIEW_STATUS_LABELS } from '@/constants/status';
import type { ManagedReview } from '@/types/reviewManagement';

interface ReviewManagementClientProps {
  initialReviews: ManagedReview[];
}

export default function ReviewManagementClient({ initialReviews }: ReviewManagementClientProps) {
  const [reviews, setReviews] = useState<ManagedReview[]>(initialReviews);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reviews/manage', { cache: 'no-store' });
      const result = await response.json() as { reviews?: ManagedReview[]; error?: string };
      if (!response.ok) throw new Error(result.error || '리뷰 목록을 불러오지 못했습니다.');
      setReviews(result.reviews || []);
    } catch (error) {
      console.error('Managed reviews refresh error:', error);
      toast.error(error instanceof Error ? error.message : '리뷰 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return reviews.filter((review) => {
      if (filter !== 'ALL' && review.status.toUpperCase() !== filter) return false;
      if (!query) return true;
      return [review.title, review.author_name, review.author_email, review.post_url]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [filter, reviews, searchQuery]);

  return (
    <div className="flex-1">
      <div className="mb-6 rounded-2xl border-2 border-gray-100 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'APPROVED', 'HIDDEN', 'PENDING', 'REJECTED'].map((status) => (
              <Button key={status} onClick={() => setFilter(status)} variant={filter === status ? 'default' : 'outline'} className="h-10">
                {status === 'ALL' ? '전체' : REVIEW_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input placeholder="캠페인, 신청자, 이메일, URL 검색..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" />
          </div>
          <Button onClick={fetchReviews} variant="outline" className="h-10" disabled={isLoading} aria-label="새로고침">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>전체: <strong>{reviews.length}</strong></span>
          <span>승인: <strong>{reviews.filter((review) => review.status === 'APPROVED').length}</strong></span>
          <span>대기: <strong>{reviews.filter((review) => review.status === 'PENDING').length}</strong></span>
          <span>검색 결과: <strong>{filteredReviews.length}</strong></span>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-12 text-center text-gray-500">리뷰가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewDetailCard key={review.id} review={review} onStatusChanged={() => fetchReviews()} />
          ))}
        </div>
      )}
    </div>
  );
}
