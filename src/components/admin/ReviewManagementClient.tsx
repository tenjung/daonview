'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Copy, CreditCard, ExternalLink, Eye, EyeOff, RefreshCw, Search, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadgeCell } from '@/components/data-table/cells/StatusBadgeCell';
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_VARIANTS } from '@/constants/status';
import type { ManagedReview } from '@/types/reviewManagement';

interface ReviewManagementClientProps {
  initialReviews: ManagedReview[];
}

const maskAccountNumber = (value: string | null) => {
  if (!value) return '미등록';
  const compact = value.replace(/\s/g, '');
  if (compact.length <= 4) return '*'.repeat(compact.length);
  return `${compact.slice(0, 3)}${'*'.repeat(Math.max(4, compact.length - 6))}${compact.slice(-3)}`;
};

export default function ReviewManagementClient({ initialReviews }: ReviewManagementClientProps) {
  const [reviews, setReviews] = useState<ManagedReview[]>(initialReviews);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revealedAccounts, setRevealedAccounts] = useState<Set<number>>(new Set());

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

  const handleStatusChange = async (review: ManagedReview, status: string) => {
    try {
      const response = await fetch('/api/hide-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '상태 변경에 실패했습니다.');
      toast.success(status === 'APPROVED' ? '리뷰를 승인했습니다.' : status === 'REJECTED' ? '리뷰를 거절했습니다.' : status === 'HIDDEN' ? '리뷰를 숨겼습니다.' : '상태를 변경했습니다.');
      await fetchReviews();
    } catch (error) {
      console.error('Review status update error:', error);
      toast.error(error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
    }
  };

  const toggleAccount = (reviewId: number) => {
    setRevealedAccounts((current) => {
      const next = new Set(current);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  const copyAccount = async (review: ManagedReview) => {
    if (!review.account_number) return;
    await navigator.clipboard.writeText([review.bank_name, review.account_holder, review.account_number].filter(Boolean).join(' / '));
    toast.success('정산 계좌정보를 복사했습니다.');
  };

  return (
    <div className="flex-1">
      <div className="mb-6 rounded-2xl border-2 border-gray-100 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'APPROVED', 'HIDDEN', 'PENDING', 'REJECTED'].map((status) => (
              <Button key={status} onClick={() => setFilter(status)} variant={filter === status ? 'default' : 'outline'} className="h-10">
                {status === 'ALL' ? '전체' : status === 'APPROVED' ? '승인됨' : status === 'HIDDEN' ? '숨김' : status === 'PENDING' ? '대기중' : '거부됨'}
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
          {filteredReviews.map((review) => {
            const isAccountRevealed = revealedAccounts.has(review.id);
            const hasReviewUrl = /^https?:\/\//i.test(review.post_url);
            return (
              <article key={review.id} className="rounded-2xl border-2 border-gray-100 bg-white p-5 transition-colors hover:border-rose-200 md:p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{review.platform}</span><span>•</span>
                        <span className="font-medium text-gray-700">{review.author_name || '작성자 없음'}</span>
                        {review.author_email && <><span>•</span><span>{review.author_email}</span></>}
                        <span>•</span><span>{new Date(review.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{review.title || '제목 없음'}</h3>
                      {hasReviewUrl ? (
                        <a href={review.post_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 break-all text-sm text-blue-600 hover:underline">
                          <ExternalLink className="h-4 w-4 shrink-0" />{review.post_url}
                        </a>
                      ) : <p className="mt-2 text-sm text-gray-400">리뷰 링크 미입력 · 구매평 증빙으로 제출</p>}
                    </div>
                    <StatusBadgeCell status={review.status} customLabels={REVIEW_STATUS_LABELS} customVariants={REVIEW_STATUS_VARIANTS} />
                  </div>

                  {review.is_purchase_experience && (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                      <div>
                        <p className="mb-2 text-sm font-bold text-gray-800">구매평 증빙</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {review.proof_urls.slice(0, 2).map((url, index) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                              <div className="relative aspect-[4/3] w-full">
                                <Image src={url} alt={index === 0 ? '구매금액 증빙' : '구매평 증빙'} fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover transition-transform group-hover:scale-[1.02]" />
                              </div>
                              <span className="block px-3 py-2 text-xs font-bold text-gray-700">{index === 0 ? '1. 구매금액 스샷' : '2. 구매평 스샷'}</span>
                            </a>
                          ))}
                          {review.proof_urls.length === 0 && <p className="text-sm text-rose-600">등록된 증빙을 찾을 수 없습니다.</p>}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="mb-3 flex items-center gap-2 font-bold text-amber-950"><CreditCard className="h-4 w-4" />페이백 계좌</div>
                        <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-sm">
                          <dt className="text-amber-700">은행</dt><dd className="font-semibold text-gray-900">{review.bank_name || '미등록'}</dd>
                          <dt className="text-amber-700">예금주</dt><dd className="font-semibold text-gray-900">{review.account_holder || '미등록'}</dd>
                          <dt className="text-amber-700">계좌번호</dt><dd className="break-all font-mono font-semibold text-gray-900">{isAccountRevealed ? review.account_number || '미등록' : maskAccountNumber(review.account_number)}</dd>
                        </dl>
                        <div className="mt-4 flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => toggleAccount(review.id)} className="border-amber-300 bg-white text-amber-900">
                            {isAccountRevealed ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}{isAccountRevealed ? '숨기기' : '전체 보기'}
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => copyAccount(review)} disabled={!review.account_number} className="border-amber-300 bg-white text-amber-900"><Copy className="mr-1 h-4 w-4" />복사</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    {review.status === 'PENDING' && <>
                      <Button onClick={() => handleStatusChange(review, 'APPROVED')} variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50"><ShieldCheck className="mr-2 h-4 w-4" />승인하기</Button>
                      <Button onClick={() => handleStatusChange(review, 'REJECTED')} variant="outline" size="sm" className="border-rose-200 text-rose-700 hover:bg-rose-50"><EyeOff className="mr-2 h-4 w-4" />거절하기</Button>
                    </>}
                    {review.status === 'APPROVED' && <Button onClick={() => handleStatusChange(review, 'HIDDEN')} variant="outline" size="sm"><EyeOff className="mr-2 h-4 w-4" />숨기기</Button>}
                    {review.status === 'HIDDEN' && <Button onClick={() => handleStatusChange(review, 'APPROVED')} variant="outline" size="sm" className="text-green-700"><Eye className="mr-2 h-4 w-4" />복원하기</Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
