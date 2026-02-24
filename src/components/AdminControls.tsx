'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

interface AdminControlsProps {
    campaignId: string | number;
    canEdit: boolean;
}

export default function AdminControls({ campaignId, canEdit }: AdminControlsProps) {
    if (!canEdit) return null;

    return (
        <Link
            href={`/dashboard/campaign/new?id=${campaignId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-all shadow-sm ml-auto"
        >
            <Settings className="w-3 h-3" />
            수정
        </Link>
    );
}
