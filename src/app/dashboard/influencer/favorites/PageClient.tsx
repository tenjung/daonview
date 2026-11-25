'use client';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import { toPublicCampaignRelation } from '@/lib/publicCampaignDto';
import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useDashboardViewer, type DashboardViewer } from '@/hooks/useDashboardViewer';
import { useRequestGuard } from '@/hooks/useRequestGuard';
import { useRouter } from 'next/navigation';
import { Campaign } from '@/types/database';
import CampaignCard from '@/components/CampaignCard';
import CampaignSkeleton from '@/components/CampaignSkeleton';
import { mapCampaignToCard } from '@/lib/campaignUtils';

import { Heart } from 'lucide-react';
import { InfluencerSummaryBanner } from '@/components/influencer/InfluencerSummaryBanner';

interface FavoriteCampaign {
    id: number;
    user_id: string;
    campaign_id: number;
    created_at: string;
    campaigns: Campaign;
}

export default function FavoritesPage({ initialViewer, initialFavorites = [] }: { initialViewer?: DashboardViewer; initialFavorites?: FavoriteCampaign[] }) {
    const { user, profile, isLoading } = useDashboardViewer(initialViewer);
    const router = useRouter();
    const beginRequest = useRequestGuard(user?.id);
    const loadedKey = useRef(initialViewer ? initialViewer.user.id + '' : '');
    const [favorites, setFavorites] = useState<FavoriteCampaign[]>(initialFavorites);
    const [loading, setLoading] = useState(!initialViewer);

    const fetchData = useCallback(async () => {
        if (!user) return;
        const isCurrent = beginRequest();

        try {
            // Fetch favorite campaigns with application counts
            const { data: favoritesData, error } = await supabase
                .from('favorites')
                .select('*, campaigns(*, applicant_count, selected_count)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!isCurrent()) return;
            if (error) throw error;
            if (favoritesData) {
                setFavorites((favoritesData as FavoriteCampaign[]).map(row => ({ ...row, campaigns: toPublicCampaignRelation(row.campaigns) })));
            }

            if (isCurrent()) setLoading(false);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            if (isCurrent()) setLoading(false);
        }
    }, [user?.id, beginRequest]);

    useEffect(() => {
        if (!isLoading && user) {
            if (profile?.role === 'ADVERTISER') {
                router.replace('/dashboard/advertiser');
                return;
            }
            if (loadedKey.current === user.id) return;
            loadedKey.current = user.id;
            queueMicrotask(() => {
                void fetchData();
            });
        } else if (!isLoading && !user) {
            queueMicrotask(() => {
                setLoading(false);
            });
        }
    }, [isLoading, user?.id, profile?.role, router, fetchData]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <DashboardPageLayout role="INFLUENCER" userName={profile?.nickname || '사용자'}>

                <div className="max-w-[1400px]">
                    <DashboardPageHeader
                        icon={Heart}
                        title="관심 캠페인"
                        description="저장해 둔 캠페인을 빠르게 다시 확인하세요."
                        actions={
                            <>
                        <Link href="/campaigns" className="inline-flex btn btn-primary text-sm px-4 py-2">캠페인 찾아보기</Link>
                            </>
                        }
                    />

                    <div className="mb-4 sm:hidden">
                        <InfluencerSummaryBanner
                            items={[{ label: '저장한 캠페인', value: favorites.length, tone: 'rose' }]}
                            columns={2}
                        />
                    </div>

                    {favorites.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:gap-6">
                            {favorites.map((fav) => {
                                const cardData = mapCampaignToCard(fav.campaigns);
                                return (
                                    <CampaignCard
                                        key={fav.id}
                                        {...cardData}
                                    />
                                );
                            })}
                            {/* Show skeletons only to fill up to 1 row (5 items) if favorites are fewer than 5 */}
                            {favorites.length < 5 && (
                                [...Array(5 - favorites.length)].map((_, i) => (
                                    <CampaignSkeleton key={`skel-fill-${i}`} variant="favorite" />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-border rounded-xl p-8 sm:p-12 text-center max-w-[800px] mx-auto">
                            <p className="text-lg text-gray-500 mb-4">아직 관심 캠페인이 없습니다.</p>
                            <p className="text-sm text-gray-400 mb-6">마음에 드는 캠페인을 찾아 저장해보세요!</p>
                            <Link href="/campaigns" className="btn btn-primary inline-block">
                                캠페인 둘러보기
                            </Link>
                        </div>
                    )}
                </div>
        </DashboardPageLayout>
    );
}
