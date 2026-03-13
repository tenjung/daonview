'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CampaignRegistrationContainer from '@/components/campaign/CampaignRegistrationContainer';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import RoleSidebar from '@/components/RoleSidebar';

export default function NewCampaignPage() {
    const { role, user, isChecking } = useRoleGuard(['ADMIN', 'ADVERTISER']);
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // SSR 에러 방지용
    if (!mounted || isChecking) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    if (!role) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <RoleSidebar role={role} />

            {/* 캠페인 등록 로직 통합 컨테이너 */}
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            }>
                <CampaignRegistrationContainer />
            </Suspense>
        </div>
    );
}
