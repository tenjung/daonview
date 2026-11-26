'use client';

// 리뷰 상세 카드 (공통): 리뷰 관리 화면 목록과 신청자 표의 리뷰 상세 모달에서 함께 사용한다.
// 표시·승인/거절/숨김 동작은 이 컴포넌트 한 곳에서만 관리한다.
import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Copy, CreditCard, ExternalLink, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { cn } from '@/lib/utils';
import type { ManagedReview, ReviewEmailNotification } from '@/types/reviewManagement';

const STATUS_CHANGE_MESSAGES: Record<string, string> = {
  APPROVED: '리뷰를 승인했습니다.',
  REJECTED: '리뷰를 거절했습니다.',
  HIDDEN: '리뷰를 숨겼습니다.',
};

interface ReviewDetailCardProps {
  review: ManagedReview;
  /** 상태 변경 성공 후 호출 (목록 새로고침·표 상태 갱신용) */
  onStatusChanged?: (review: ManagedReview, status: string) => void | Promise<void>;
  /** 모달 안에서는 테두리 없이 표시 */
  bare?: boolean;
}

export function ReviewDetailCard({ review, onStatusChanged, bare = false }: ReviewDetailCardProps) {
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const hasReviewUrl = /^https?:\/\//i.test(review.post_url);

  const handleStatusChange = async (status: string) => {
    if (changingStatus) return;
    setChangingStatus(status);
    try {
      const response = await fetch('/api/hide-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, status }),
      });
      const result = await response.json() as { error?: string; emailNotification?: ReviewEmailNotification };
      if (!response.ok) throw new Error(result.error || '상태 변경에 실패했습니다.');
      toast.success(STATUS_CHANGE_MESSAGES[status] || '상태를 변경했습니다.');
      const notification = result.emailNotification;
      if (notification?.status === 'SENT') {
        toast.success(notification.message || '승인 메일 발송 요청이 완료되었습니다.');
      } else if (notification && notification.status !== 'NOT_REQUIRED') {
        toast.warning(notification.message || '승인 메일이 발송되지 않았습니다.');
      }
      await onStatusChanged?.(review, status);
    } catch (error) {
      console.error('Review status update error:', error);
      toast.error(error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
    } finally {
      setChangingStatus(null);
    }
  };

  const copyAccount = async () => {
    if (!review.account_number) return;
    await navigator.clipboard.writeText([review.bank_name, review.account_holder, review.account_number].filter(Boolean).join(' / '));
    toast.success('정산 계좌정보를 복사했습니다.');
  };

  return (
    <article
      className={cn(
        'bg-white',
        bare ? '' : 'rounded-2xl border-2 border-gray-100 p-5 transition-colors hover:border-rose-200 md:p-6'
      )}
    >
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
          <StatusBadge domain="REVIEW" status={review.status} />
        </div>

        {review.is_purchase_experience && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div>
              <p className="mb-2 text-sm font-bold text-gray-800">구매평 증빙</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {review.proof_urls.slice(0, 2).map((url, index) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <div className="relative aspect-[4/3] w-full">
                      <Image src={url} alt={index === 0 ? '구매금액 증빙' : '구매평 증빙'} fill unoptimized sizes="(max-width: 640px) 100vw, 40vw" className="object-cover transition-transform group-hover:scale-[1.02]" />
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
                <dt className="text-amber-700">계좌번호</dt><dd className="break-all font-mono font-semibold text-gray-900">{review.account_number || '미등록'}</dd>
              </dl>
              <div className="mt-4 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={copyAccount} disabled={!review.account_number} className="border-amber-300 bg-white text-amber-900"><Copy className="mr-1 h-4 w-4" />복사</Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {review.status === 'PENDING' && <>
            <Button onClick={() => handleStatusChange('APPROVED')} disabled={changingStatus !== null} variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50"><ShieldCheck className="mr-2 h-4 w-4" />승인하기</Button>
            <Button onClick={() => handleStatusChange('REJECTED')} disabled={changingStatus !== null} variant="outline" size="sm" className="border-rose-200 text-rose-700 hover:bg-rose-50"><EyeOff className="mr-2 h-4 w-4" />거절하기</Button>
          </>}
          {review.status === 'APPROVED' && <Button onClick={() => handleStatusChange('HIDDEN')} disabled={changingStatus !== null} variant="outline" size="sm"><EyeOff className="mr-2 h-4 w-4" />숨기기</Button>}
          {review.status === 'HIDDEN' && <Button onClick={() => handleStatusChange('APPROVED')} disabled={changingStatus !== null} variant="outline" size="sm" className="text-green-700"><Eye className="mr-2 h-4 w-4" />복원하기</Button>}
        </div>
      </div>
    </article>
  );
}

export default ReviewDetailCard;
