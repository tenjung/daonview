'use client';

import { ApplicationStatus } from '@/types/database';

interface ApplicationStatusBadgeProps {
    status?: ApplicationStatus | string;
}

export default function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
    // DB 값을 대문자로 변환하여 비교
    const normalizedStatus = status?.toUpperCase();

    switch (normalizedStatus) {
        case 'PENDING':
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                    대기중
                </span>
            );
        case 'APPROVED':
        case 'SELECTED':
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                    선정됨
                </span>
            );
        case 'REJECTED':
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                    거절됨
                </span>
            );
        case 'COMPLETED':
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                    완료됨
                </span>
            );
        case 'CANCELLED':
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                    취소됨
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                    알 수 없음
                </span>
            );
    }
}
