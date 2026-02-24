import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED';
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface StatusBadgeCellProps {
    status: string | null | undefined;
    customLabels?: Record<string, string>;
    customVariants?: Record<string, BadgeVariant>;
    unknownLabel?: string;
    className?: string;
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

const statusVariants: Record<string, BadgeVariant> = {
    PENDING: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
    ACTIVE: 'default',
    INACTIVE: 'secondary',
    COMPLETED: 'secondary',
    CANCELLED: 'outline',
};

export function StatusBadgeCell({
    status,
    customLabels,
    customVariants,
    unknownLabel = '알 수 없음',
    className,
}: StatusBadgeCellProps) {
    if (!status) {
        return <Badge variant="secondary">{unknownLabel}</Badge>;
    }

    const normalizedStatus = String(status).toUpperCase();
    const labels = customLabels || defaultLabels;
    const variants = customVariants || statusVariants;
    const label = labels[normalizedStatus] || status;
    const variant = variants[normalizedStatus] || 'secondary';

    return (
        <Badge variant={variant} className={cn('whitespace-nowrap', className)}>
            {label}
        </Badge>
    );
}
