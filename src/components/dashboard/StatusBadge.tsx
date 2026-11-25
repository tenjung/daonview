// 공통 상태 배지 (시안 B: 의미별 색 + 점, 부드러운 알약형)
// 라벨·톤은 constants/status.ts 의 STATUS_DOMAINS 에서만 정의한다.
import { cn } from '@/lib/utils';
import { resolveStatus, type StatusDomain, type StatusTone } from '@/constants/status';

const TONE_STYLES: Record<StatusTone, { pill: string; dot: string }> = {
  pending: { pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  success: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  progress: { pill: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  danger: { pill: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  neutral: { pill: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

interface StatusBadgeProps {
  domain: StatusDomain;
  status?: string | null;
  /** 특수 상황에서 라벨만 바꿀 때 (예: 보류) */
  label?: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ domain, status, label, tone, className }: StatusBadgeProps) {
  const resolved = resolveStatus(domain, status);
  const style = TONE_STYLES[tone ?? resolved.tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold',
        style.pill,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} aria-hidden="true" />
      {label ?? resolved.label}
    </span>
  );
}

export default StatusBadge;
