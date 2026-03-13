'use client';

import { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import { INFLUENCER_NAV } from '@/constants/navigation';

function InfluencerSidebarContent() {
    const { profile } = useAuthStore();

    return (
        <DashboardSidebar
            userType="INFLUENCER"
            userName={profile?.nickname || '인플루언서'}
            links={INFLUENCER_NAV}
        />
    );
}

export default function InfluencerSidebar() {
    return (
        <Suspense fallback={<aside className="w-[260px] bg-white border-r border-border shrink-0" />}>
            <InfluencerSidebarContent />
        </Suspense>
    );
}
