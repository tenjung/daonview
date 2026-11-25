'use client';

import { ApplicationStatus } from '@/types/database';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

interface ApplicationStatusBadgeProps {
    status?: ApplicationStatus | string;
}

export default function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
    return <StatusBadge domain="APPLICATION" status={status} />;
}
