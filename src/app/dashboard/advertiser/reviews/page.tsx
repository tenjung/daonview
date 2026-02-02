'use client';

import AdvertiserSidebar from '@/components/AdvertiserSidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuthStore } from '@/store/authStore';

export default function AdvertiserReviewsPage() {
    const { profile } = useAuthStore();

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={profile?.company_name || profile?.nickname || '광고주'}
                links={[
                    { href: '/dashboard/advertiser', label: '대시보드' },
                    { href: '/dashboard/advertiser/campaigns', label: '캠페인 관리' },
                    { href: '/dashboard/advertiser/applicants', label: '신청자 목록' },
                    { href: '/dashboard/advertiser/reviews', label: '리뷰 작업 현황', active: true },
                    { href: '/dashboard/advertiser/verification', label: '사업자 인증' },
                    { href: '/dashboard/advertiser/brands', label: '브랜드 관리' },
                    {
                        href: '/profile/edit',
                        label: '계정 설정',
                        subLinks: [
                            { href: '/profile/edit?tab=basic', label: '기본 정보' }
                        ]
                    },
                    { href: '/contact', label: '1:1 문의' }
                ]}
            />
            <div className="flex-1 bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">리뷰 작업 현황</h1>
                    <p className="text-gray-500 mb-8">선정된 리뷰어들이 작성한 콘텐츠를 확인하고 관리합니다.</p>
                    
                    <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">아직 등록된 리뷰가 없습니다</h3>
                        <p className="text-gray-500">리뷰어가 콘텐츠를 등록하면 이곳에서 확인할 수 있습니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
