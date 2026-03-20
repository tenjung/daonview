export const INQUIRY_CATEGORY_LABELS: Record<string, string> = {
  EXPERIENCE: '체험단 문의',
  POINT: '포인트/정산',
  ERROR: '오류 신고',
  AD_PARTNERSHIP: '제휴/광고',
};

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  PENDING: '접수대기',
  ANSWERED: '답변완료',
};

export function getInquiryCategoryLabel(category?: string | null) {
  const key = (category || '').toUpperCase();
  return INQUIRY_CATEGORY_LABELS[key] || category || '-';
}

export function getInquiryStatusLabel(status?: string | null) {
  const key = (status || '').toUpperCase();
  return INQUIRY_STATUS_LABELS[key] || status || '-';
}

export function isInquiryAnswered(status?: string | null) {
  return (status || '').toUpperCase() === 'ANSWERED';
}
