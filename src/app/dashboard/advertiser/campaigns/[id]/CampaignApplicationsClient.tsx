'use client';

import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import ApplicationsTableClient from '@/components/admin/ApplicationsTableClient';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import type { Application } from '@/types/database';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CampaignApplicationsClientProps {
    campaignId: string;
    campaignNumericId: number;
    campaignTitle: string;
    campaignCategory?: string;
    campaignType?: string;
    recruitCount: number;
    initialApplications: Application[];
}

export default function CampaignApplicationsClient({
    campaignId,
    campaignNumericId,
    campaignTitle,
    campaignCategory,
    campaignType,
    recruitCount,
    initialApplications,
}: CampaignApplicationsClientProps) {
    const { profile } = useAuthStore();

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={profile?.company_name || profile?.nickname || '광고주'}
                links={ADVERTISER_LINKS.map((link) => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser/campaigns',
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[1600px] mx-auto">
                    <Link
                        href="/dashboard/advertiser/campaigns"
                        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
                    >
                        <ArrowLeft size={16} />
                        목록으로 돌아가기
                    </Link>

                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                                    {campaignCategory || '카테고리'}
                                </Badge>
                                <span className="text-sm text-gray-400">ID: {campaignNumericId}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{campaignTitle}</h1>
                        </div>
                    </div>

                    <ApplicationsTableClient
                        initialApplications={initialApplications}
                        campaignId={campaignId}
                        campaignTitle={campaignTitle}
                        campaignCategory={campaignCategory || ''}
                        campaignType={campaignType}
                        recruitCount={recruitCount}
                    />
                </div>
            </main>
        </div>
    );
}
