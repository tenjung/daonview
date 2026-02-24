'use client';

import { ApplicationStatus } from '@/types/database';
import { StatusBadgeCell } from '@/components/data-table/cells/StatusBadgeCell';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_VARIANTS } from '@/constants/status';

interface ApplicationStatusBadgeProps {
    status?: ApplicationStatus | string;
}

export default function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
    return (
        <StatusBadgeCell
            status={status}
            customLabels={APPLICATION_STATUS_LABELS}
            customVariants={APPLICATION_STATUS_VARIANTS}
            className="text-xs font-bold"
            unknownLabel="알 수 없음"
        />
    );
}
