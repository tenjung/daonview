'use client';

import { supabase } from '@/lib/supabaseClient';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuthStore } from '@/store/authStore';
import { UnifiedAdvertiserCampaigns } from '@/components/admin/UnifiedAdvertiserCampaigns';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import UnifiedAdvertiserPage from './UnifiedAdvertiserPage';
import { ADVERTISER_LINKS } from '@/constants/navigation';

export default function AdvertiserCampaignsPage() {
    const { profile } = useAuthStore();

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={profile?.company_name || profile?.nickname || '광고주'}
                links={ADVERTISER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser/campaigns'
                }))}
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

