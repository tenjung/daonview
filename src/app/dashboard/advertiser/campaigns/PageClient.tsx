'use client';

import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import { useDashboardViewer, type DashboardViewer } from '@/hooks/useDashboardViewer';
import type { Campaign } from '@/types/database';
import { UnifiedAdvertiserCampaigns } from '@/components/admin/UnifiedAdvertiserCampaigns';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';

export default function AdvertiserCampaignsPage({ initialViewer, initialCampaigns }: { initialViewer: DashboardViewer; initialCampaigns: Campaign[] }) {
    const { profile } = useDashboardViewer(initialViewer);

    return (
        <DashboardPageLayout role="ADVERTISER" userName={profile?.company_name || profile?.nickname || '광고주'}>

                <div className="max-w-[1600px] mx-auto">
                    <DashboardPageHeader
                        icon={Megaphone}
                        title="내 캠페인"
                        description="등록하신 모든 캠페인을 효율적으로 관리하세요."
                        actions={
                            <>
                        <Link
                            href="/dashboard/campaign/new"
                            className="bg-primary text-white px-5 py-3 rounded-2xl font-bold shadow-sm hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            + 새 캠페인 등록
                        </Link>
                            </>
                        }
                    />

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <UnifiedAdvertiserCampaigns initialData={initialCampaigns} />
                    </div>
                </div>
        </DashboardPageLayout>
    );
}
