'use client';

import { Suspense } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import CampaignRegistrationContainer from '@/components/campaign/CampaignRegistrationContainer';

/**
 * NewCampaignPage
 * 
 * 이제 이 페이지는 레이아웃 배치와 독립된 캠페인 등록 컨테이너를 호출하는 
 * 최소한의 역할만 수행합니다. (Separation of Concerns)
 */
export default function NewCampaignPage() {
    return (
        <div className="flex min-h-screen bg-background">
            {/* 전역 사이드바 */}
            <AdminSidebar />

            {/* 
               캠페인 등록 통합 컨테이너 
               - 로직, 스텝 관리, 버튼 HUD 플로팅 기능이 모두 이 안에 캡슐화되어 있습니다.
            */}
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
