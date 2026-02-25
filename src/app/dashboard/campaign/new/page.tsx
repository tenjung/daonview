'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AdminSidebar from '@/components/AdminSidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import CampaignRegistrationContainer from '@/components/campaign/CampaignRegistrationContainer';
import { ADVERTISER_LINKS, INFLUENCER_LINKS } from '@/constants/navigation';

export default function NewCampaignPage() {
    const { profile, user, isLoading } = useAuthStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // SSR 에러 방지용
    if (!mounted || isLoading) {
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

    const role = profile?.role || user?.user_metadata?.role || 'INFLUENCER';
    const isAdvertiser = role === 'ADVERTISER';
    const isAdmin = role === 'ADMIN';
    const displayName = profile?.nickname || profile?.company_name || user?.user_metadata?.name || '사용자';

    return (
        <div className="flex min-h-screen bg-background">
            {/* 권한별 사이드바 분기 렌더링 */}
            {isAdmin ? (
                <AdminSidebar />
            ) : (
                <DashboardSidebar
                    userType={isAdvertiser ? 'ADVERTISER' : 'INFLUENCER'}
                    userName={displayName}
                    links={isAdvertiser ? ADVERTISER_LINKS : INFLUENCER_LINKS}
                />
            )}

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
