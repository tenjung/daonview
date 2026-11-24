export type ApplicationProgressRequest =
  | { action: 'CONFIRM_PURCHASE'; applicationId: number }
  | { action: 'REQUEST_EXTENSION'; applicationId: number; reason: string }
  | { action: 'DECIDE_EXTENSION'; applicationId: number; decision: 'APPROVED' | 'REJECTED' }
  | { action: 'REGISTER_TRACKING'; applicationId: number; company: string; number: string };

/** 선정 이후 진행 단계 변경은 서버 API(/api/applications/progress)로만 처리한다. */
export async function postApplicationProgress(payload: ApplicationProgressRequest): Promise<{ reviewDeadline: string | null }> {
  const response = await fetch('/api/applications/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(typeof result?.error === 'string' ? result.error : '처리 중 오류가 발생했습니다.');
  }
  return { reviewDeadline: result.reviewDeadline ?? null };
}
