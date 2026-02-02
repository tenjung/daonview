'use client';

import { supabase } from '@/lib/supabaseClient';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuthStore } from '@/store/authStore';
import { UnifiedAdvertiserCampaigns } from '@/components/admin/UnifiedAdvertiserCampaigns';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import UnifiedAdvertiserPage from './UnifiedAdvertiserPage';

export default function AdvertiserCampaignsPage() {
    const { profile } = useAuthStore();

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={profile?.company_name || profile?.nickname || '광고주'}
                links={[
                    { href: '/dashboard/advertiser', label: '대시보드' },
                    { href: '/dashboard/advertiser/campaigns', label: '캠페인 관리', active: true },
                    { href: '/dashboard/advertiser/applicants', label: '신청자 목록' },
                    { href: '/dashboard/advertiser/reviews', label: '리뷰 작업 현황' },
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

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 italic">
                                <Megaphone className="w-8 h-8 text-primary" />
                                My Campaigns
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">
                                등록하신 모든 캠페인을 효율적으로 관리하세요.
                            </p>
                        </div>
                        <Link 
                            href="/dashboard/campaign/new" 
                            className="bg-primary text-white px-5 py-3 rounded-2xl font-bold shadow-sm hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            + 새 캠페인 등록
                        </Link>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <UnifiedAdvertiserPage />
                    </div>
                </div>
            </div>
        </div>
    );
}

