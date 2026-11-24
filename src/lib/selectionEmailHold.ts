// Client-safe normalizer: never import server SDKs or service credentials here.
export const SELECTION_EMAIL_HOLD_REASONS = {
  MAILBOX_INACTIVE: '메일함 비활성', USER_NOT_FOUND: '존재하지 않는 주소',
  MAILBOX_FULL: '메일함 용량 초과', SUPPRESSED: 'AWS 발송 차단',
  OTHER: '기타 반송',
} as const;
export interface SelectionEmailHold {
  id: string;
  applicationId: number;
  recipient: string;
  reason: keyof typeof SELECTION_EMAIL_HOLD_REASONS;
  occurredAt: string;
  smtpStatus: string | null;
  kakao: { status: SelectionKakaoStatus; at: string } | null;
}
export const SELECTION_KAKAO_STATUS_LABELS = {
  PREPARED: '카톡 발송 중', SENT: '카톡 발송됨', FAILED: '카톡 발송 실패', UNKNOWN: '카톡 결과 확인 필요',
} as const;
export type SelectionKakaoStatus = keyof typeof SELECTION_KAKAO_STATUS_LABELS;
function normalizeKakao(raw: unknown): SelectionEmailHold['kakao'] {
  const rows = Array.isArray(raw) ? raw as Array<Record<string, unknown>> : [];
  const latest = rows.filter(row => typeof row?.id === 'number' && typeof row?.created_at === 'string')
    .sort((a, b) => Number(b.id) - Number(a.id))[0];
  if (!latest) return null;
  const status = String(latest.status || '').toUpperCase();
  return {
    status: status in SELECTION_KAKAO_STATUS_LABELS ? status as SelectionKakaoStatus : 'UNKNOWN',
    at: typeof latest.completed_at === 'string' ? latest.completed_at : String(latest.created_at),
  };
}
/** 재발송 가능 여부: 기록 없음 또는 접수 거부(FAILED)만 허용. DB 유니크 인덱스와 같은 기준. */
export function canSendSelectionKakao(hold: SelectionEmailHold) {
  return !hold.kakao || hold.kakao.status === 'FAILED';
}
export function normalizeSelectionEmailHold(raw: unknown): SelectionEmailHold {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid hold record');
  const r = raw as Record<string, unknown>;
  const feedback = r.feedback as Record<string, unknown> | null;
  if (typeof r.id !== 'string' || !Number.isSafeInteger(r.application_id) || !feedback
    || typeof feedback.recipient !== 'string' || typeof feedback.occurred_at !== 'string') throw new Error('Invalid hold record');
  const reason = String(feedback.reason || '').toUpperCase();
  return {
    id: r.id, applicationId: Number(r.application_id), recipient: feedback.recipient,
    reason: reason in SELECTION_EMAIL_HOLD_REASONS ? reason as SelectionEmailHold['reason'] : 'OTHER',
    occurredAt: feedback.occurred_at, smtpStatus: typeof feedback.smtp_status === 'string' ? feedback.smtp_status : null,
    kakao: normalizeKakao(r.kakao),
  };
}
export function isSelectedApplication(status: string) {
  return ['APPROVED', 'SELECTED'].includes(String(status).toUpperCase());
}
export function getApplicationManagementStatus(status: string, hold?: SelectionEmailHold) {
  return isSelectedApplication(status) && hold ? 'HELD' : String(status).toUpperCase();
}
