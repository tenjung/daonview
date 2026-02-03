'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Campaign } from '@/types/database';
import DashboardSidebar from '@/components/DashboardSidebar';
import CampaignCard from '@/components/CampaignCard';
import CampaignSkeleton from '@/components/CampaignSkeleton';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import { INFLUENCER_LINKS } from '@/constants/navigation';

interface FavoriteCampaign {
    id: number;
    user_id: string;
    campaign_id: number;
    created_at: string;
    campaigns: Campaign;
}

export default function FavoritesPage() {
    const { user, profile, isLoading } = useAuthStore();
    const router = useRouter();
    const [favorites, setFavorites] = useState<FavoriteCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && user) {
            if (profile?.role === 'ADVERTISER') {
                router.replace('/dashboard/advertiser');
                return;
            }
            fetchData();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [isLoading, user, profile, router]);

    async function fetchData() {
        if (!user) return;

        try {
            // Fetch favorite campaigns with application counts
            const { data: favoritesData } = await supabase
                .from('favorites')
                .select('*, campaigns(*, applications(count))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (favoritesData) {
                setFavorites(favoritesData as FavoriteCampaign[]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar
                userType="INFLUENCER"
                userName={profile?.nickname || '사용자'}
                links={INFLUENCER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/influencer/favorites'
                }))}
            />

            <main className="flex-1 px-4 md:px-10 py-10 overflow-y-auto">
                <div className="max-w-[1400px]">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-text-main">관심 캠페인</h1>
                        <Link href="/campaigns" className="btn btn-primary text-sm px-4 py-2">캠페인 찾아보기</Link>
                    </div>

                    {favorites.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                            {favorites.map((fav) => {
                                const cardData = mapCampaignToCard(fav.campaigns as any);
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
                        <div className="bg-white border border-border rounded-xl p-12 text-center max-w-[800px] mx-auto">
                            <p className="text-lg text-gray-500 mb-4">아직 관심 캠페인이 없습니다.</p>
                            <p className="text-sm text-gray-400 mb-6">마음에 드는 캠페인을 찾아 저장해보세요!</p>
                            <Link href="/campaigns" className="btn btn-primary inline-block">
                                캠페인 둘러보기
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
