import { Badge } from '@/components/ui/badge';

type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED';

interface StatusBadgeCellProps {
    status: string | null | undefined;
    customLabels?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
    PENDING: '대기중',
    APPROVED: '승인됨',
    REJECTED: '거절됨',
    ACTIVE: '활성',
    INACTIVE: '비활성',
    COMPLETED: '완료',
    CANCELLED: '취소됨',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDING: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
    ACTIVE: 'default',
    INACTIVE: 'secondary',
    COMPLETED: 'secondary',
    CANCELLED: 'outline',
};

export function StatusBadgeCell({ status, customLabels }: StatusBadgeCellProps) {
    if (!status) {
        return <Badge variant="secondary">알 수 없음</Badge>;
    }

    const normalizedStatus = status.toUpperCase();
    const labels = customLabels || defaultLabels;
    const label = labels[normalizedStatus] || status;
    const variant = statusVariants[normalizedStatus] || 'secondary';

    return (
        <Badge variant={variant} className="whitespace-nowrap">
            {label}
        </Badge>
    );
}
