export type StatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  APPROVED: '✅ 승인됨',
  HIDDEN: '🚫 숨김',
  PENDING: '⏳ 대기중',
  REJECTED: '❌ 거부됨',
};

export const REVIEW_STATUS_VARIANTS: Record<string, StatusBadgeVariant> = {
  APPROVED: 'default',
  HIDDEN: 'secondary',
  PENDING: 'outline',
  REJECTED: 'destructive',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: '입금 대기',
  PAID: '결제 완료',
  CANCELLED: '결제 취소',
  FAILED: '결제 실패',
};

export const PAYMENT_STATUS_VARIANTS: Record<string, StatusBadgeVariant> = {
  PENDING: 'outline',
  PAID: 'default',
  CANCELLED: 'destructive',
  FAILED: 'secondary',
};

export const COUPON_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: '사용 가능',
  USED: '사용 완료',
  EXPIRED: '만료됨',
};

export const COUPON_STATUS_VARIANTS: Record<string, StatusBadgeVariant> = {
  AVAILABLE: 'default',
  USED: 'secondary',
  EXPIRED: 'destructive',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  APPROVED: '선정됨',
  SELECTED: '선정됨',
  REJECTED: '거절됨',
  COMPLETED: '완료됨',
  CANCELLED: '취소됨',
};

export const APPLICATION_STATUS_VARIANTS: Record<string, StatusBadgeVariant> = {
  PENDING: 'outline',
  APPROVED: 'default',
  SELECTED: 'default',
  REJECTED: 'destructive',
  COMPLETED: 'secondary',
  CANCELLED: 'secondary',
};
