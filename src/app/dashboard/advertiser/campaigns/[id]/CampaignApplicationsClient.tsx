'use client';

import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import { useAuthStore } from '@/store/authStore';
import ApplicationsTableClient from '@/components/admin/ApplicationsTableClient';

import type { Application } from '@/types/database';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SelectionEmailHold } from '@/lib/selectionEmailHold';

interface CampaignApplicationsClientProps {
    campaignId: string;
    campaignNumericId: number;
    campaignTitle: string;
    campaignCategory?: string;
    campaignType?: string;
    campaignProductName?: string;
    productUrlIndividual?: boolean;
    recruitCount: number;
    initialApplications: Application[];
    initialEmailHolds: SelectionEmailHold[];
    canResolveEmailHolds: boolean;
}

export default function CampaignApplicationsClient({
    campaignId,
    campaignNumericId,
    campaignTitle,
    campaignCategory,
    campaignType,
    campaignProductName,
    productUrlIndividual = false,
    recruitCount,
    initialApplications,
    initialEmailHolds,
    canResolveEmailHolds,
}: CampaignApplicationsClientProps) {
    const { profile } = useAuthStore();

    return (
        <DashboardPageLayout role="ADVERTISER" userName={profile?.company_name || profile?.nickname || '광고주'}>

                <div className="max-w-[1600px] mx-auto">
                    <DashboardPageHeader
                        eyebrow={
                            <div className="flex flex-col gap-3">
                                <Link href="/dashboard/advertiser/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 w-fit">
                                    <ArrowLeft size={16} />
                                    목록으로 돌아가기
                                </Link>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                                        {campaignCategory || '카테고리'}
                                    </Badge>
                                    <span className="text-sm text-gray-400">ID: {campaignNumericId}</span>
                                </div>
                            </div>
                        }
                        title={campaignTitle}
                    />

                    <ApplicationsTableClient
                        initialApplications={initialApplications}
                        initialEmailHolds={initialEmailHolds}
                        canResolveEmailHolds={canResolveEmailHolds}
                        campaignId={campaignId}
                        campaignTitle={campaignTitle}
                        campaignCategory={campaignCategory || ''}
                        campaignType={campaignType}
                        campaignProductName={campaignProductName}
                        productUrlIndividual={productUrlIndividual}
                        recruitCount={recruitCount}
                    />
                </div>
        </DashboardPageLayout>
    );
}
