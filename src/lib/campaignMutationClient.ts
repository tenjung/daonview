'use client';
import { toast } from 'sonner';

export async function campaignMutation<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '처리하지 못했습니다. 다시 시도하기 전에 현재 상태를 확인해 주세요.');
  if (result.cacheWarning) toast.warning(result.cacheWarning);
  window.dispatchEvent(new Event('campaign-data-changed'));
  return result as T;
}
