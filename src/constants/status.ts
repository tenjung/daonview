import { CAMPAIGN_STATUS_LABELS } from '@/constants/campaign';
import { INQUIRY_STATUS_LABELS } from '@/constants/inquiry';

// 상태 배지 공통 규칙 (시안 B: 의미별 색 + 점)
// - DB 값(UPPERCASE) → 라벨·톤은 이 파일에서만 정의한다.
// - 화면에서는 StatusBadge(domain, status)만 사용한다.
export type StatusTone = 'pending' | 'success' | 'progress' | 'danger' | 'neutral';

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  APPROVED: '승인됨',
  HIDDEN: '숨김',
  PENDING: '대기중',
  REJECTED: '거부됨',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: '입금 대기',
  PAID: '결제 완료',
  PARTIAL_CANCELLED: '부분 취소',
  CANCELLED: '결제 취소',
  FAILED: '결제 실패',
};

export const REFUND_REQUEST_STATUS_LABELS: Record<string, string> = {
  REQUESTED: '요청 접수',
  APPROVED: '부분 환불 완료',
  REJECTED: '반려됨',
  CANCELLED: '취소됨',
  COMPLETED: '환불 완료',
};

export const COUPON_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: '사용 가능',
  USED: '사용 완료',
  EXPIRED: '만료됨',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  APPROVED: '선정됨',
  SELECTED: '선정됨',
  REJECTED: '거절됨',
  COMPLETED: '완료됨',
  CANCELLED: '취소됨',
};

/** 인플루언서 본인에게 보여주는 신청 상태 (완곡한 표현) */
export const INFLUENCER_APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: '심사중',
  APPROVED: '선정됨',
  SELECTED: '선정됨',
  REJECTED: '미선정',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

/** 인플루언서 본인에게 보여주는 리뷰 검수 상태 */
export const INFLUENCER_REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING: '검수중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
  HIDDEN: '숨김',
};

export const PARTNER_INQUIRY_STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '확인중',
  ANSWERED: '답변완료',
  COMPLETED: '답변완료',
};

const APPLICATION_TONES: Record<string, StatusTone> = {
  PENDING: 'pending',
  APPROVED: 'success',
  SELECTED: 'success',
  REJECTED: 'danger',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
};

const REVIEW_TONES: Record<string, StatusTone> = {
  PENDING: 'pending',
  APPROVED: 'success',
  REJECTED: 'danger',
  HIDDEN: 'neutral',
};

export const STATUS_DOMAINS = {
  APPLICATION: { labels: APPLICATION_STATUS_LABELS, tones: APPLICATION_TONES },
  INFLUENCER_APPLICATION: { labels: INFLUENCER_APPLICATION_STATUS_LABELS, tones: APPLICATION_TONES },
  CAMPAIGN: {
    labels: CAMPAIGN_STATUS_LABELS,
    tones: { PENDING: 'pending', RECRUITING: 'progress', ONGOING: 'progress', COMPLETED: 'neutral', DRAFT: 'neutral', REJECTED: 'danger' },
  },
  REVIEW: { labels: REVIEW_STATUS_LABELS, tones: REVIEW_TONES },
  INFLUENCER_REVIEW: { labels: INFLUENCER_REVIEW_STATUS_LABELS, tones: REVIEW_TONES },
  PAYMENT: {
    labels: PAYMENT_STATUS_LABELS,
    tones: { PENDING: 'pending', PAID: 'success', PARTIAL_CANCELLED: 'neutral', CANCELLED: 'danger', FAILED: 'danger' },
  },
  REFUND_REQUEST: {
    labels: REFUND_REQUEST_STATUS_LABELS,
    tones: { REQUESTED: 'pending', APPROVED: 'progress', REJECTED: 'danger', CANCELLED: 'neutral', COMPLETED: 'success' },
  },
  COUPON: {
    labels: COUPON_STATUS_LABELS,
    tones: { AVAILABLE: 'success', USED: 'neutral', EXPIRED: 'danger' },
  },
  INQUIRY: {
    labels: INQUIRY_STATUS_LABELS,
    tones: { PENDING: 'pending', ANSWERED: 'success' },
  },
  PARTNER_INQUIRY: {
    labels: PARTNER_INQUIRY_STATUS_LABELS,
    tones: { PENDING: 'pending', IN_PROGRESS: 'progress', ANSWERED: 'success', COMPLETED: 'success' },
  },
} satisfies Record<string, { labels: Record<string, string>; tones: Record<string, StatusTone> }>;

export type StatusDomain = keyof typeof STATUS_DOMAINS;

export function resolveStatus(domain: StatusDomain, status?: string | null) {
  const key = String(status || '').toUpperCase();
  const config = STATUS_DOMAINS[domain];
  const labels = config.labels as Record<string, string>;
  const tones = config.tones as Record<string, StatusTone>;
  return {
    key,
    label: labels[key] || (status ? String(status) : '알 수 없음'),
    tone: tones[key] || ('neutral' as StatusTone),
  };
}
