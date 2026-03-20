'use client';

import { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_NAV } from '@/constants/navigation';

function AdvertiserSidebarContent() {
    const { profile } = useAuthStore();

    return (
        <DashboardSidebar
            userType="ADVERTISER"
            userName={profile?.company_name || profile?.nickname || '광고주'}
            links={ADVERTISER_NAV}
        />
    );
}

export default function AdvertiserSidebar() {
    return (
        <Suspense fallback={<aside className="w-[260px] bg-white border-r border-border shrink-0" />}>
            <AdvertiserSidebarContent />
        </Suspense>
    );
}
