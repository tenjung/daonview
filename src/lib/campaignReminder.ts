export const REMINDER_TYPE = 'CAMPAIGN_PROGRESS_REMINDER' as const;
export type ReminderSource = 'AUTOMATIC' | 'MANUAL_CAMPAIGN_44';
export type ReminderStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'SKIPPED' | 'FAILED' | 'UNKNOWN';

export function isReminderEligible(application: { status: string | null; review_submitted: boolean | null }) {
  return ['SELECTED', 'APPROVED'].includes(String(application.status || '').toUpperCase())
    && !application.review_submitted;
}

export function getReminderDeadline(applicationDeadline: string | null, rawOptions: unknown, now = new Date()) {
  const root = Array.isArray(rawOptions) ? rawOptions[0] : rawOptions;
  const options = root && typeof root === 'object' ? root as Record<string, unknown> : {};
  const step = options.step1Data && typeof options.step1Data === 'object'
    ? options.step1Data as Record<string, unknown> : {};
  // 모집 종료일이나 선정일에서 마감일을 추정하지 않는다.
  const raw = applicationDeadline || (typeof step.reviewDeadline === 'string' ? step.reviewDeadline : '');
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const deadline = new Date(dateOnly ? `${raw}T23:59:59.999+09:00` : raw);
  const valid = !Number.isNaN(deadline.getTime())
    && (!dateOnly || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(deadline) === raw);
  return {
    deadlineDate: valid
      ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(deadline)
      : '가이드 확인 또는 카카오톡 문의',
    isDeadlinePassed: valid && deadline.getTime() < now.getTime(),
  };
}

/** SES가 명시적으로 거절한 4xx만 실패로 확정하고 연결 단절 등은 UNKNOWN으로 둔다. */
export function isDefinitiveEmailRejection(error: unknown) {
  if (!error || typeof error !== 'object' || !('$metadata' in error)) return false;
  const metadata = error.$metadata;
  if (!metadata || typeof metadata !== 'object' || !('httpStatusCode' in metadata)) return false;
  const code = metadata.httpStatusCode;
  return typeof code === 'number' && code >= 400 && code < 500;
}
