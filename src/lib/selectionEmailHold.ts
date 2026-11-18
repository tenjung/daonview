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
  };
}
export function isSelectedApplication(status: string) {
  return ['APPROVED', 'SELECTED'].includes(String(status).toUpperCase());
}
export function getApplicationManagementStatus(status: string, hold?: SelectionEmailHold) {
  return isSelectedApplication(status) && hold ? 'HELD' : String(status).toUpperCase();
}
