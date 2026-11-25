// 데이터 테이블용 상태 셀: 공통 StatusBadge 를 그대로 사용한다.
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import type { StatusDomain } from '@/constants/status';

interface StatusBadgeCellProps {
    status: string | null | undefined;
    domain: StatusDomain;
    className?: string;
}

export function StatusBadgeCell({ status, domain, className }: StatusBadgeCellProps) {
    return <StatusBadge domain={domain} status={status} className={className} />;
}
