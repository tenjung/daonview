'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AdminControls({ campaignId, createdBy }: { campaignId: string | number, createdBy?: string }) {
    const { user, profile, isLoading } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. 하이드레이션 완료 전이거나 로딩 중이면 표시하지 않음
    if (!mounted || isLoading || !profile) return null;

    // 2. 권한 체크 (ADMIN 또는 캠페인 작성자 본인)
    const isAdmin = profile.role === 'ADMIN';
    const isOwner = profile.role === 'ADVERTISER' && user?.id === createdBy;

    if (!isAdmin && !isOwner) return null;

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
