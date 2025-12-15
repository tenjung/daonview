'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Profile, Campaign } from '@/types/database';

interface FavoriteCampaign {
    id: number;
    user_id: string;
    campaign_id: number;
    created_at: string;
    campaigns: Campaign;
}

export default function FavoritesPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [favorites, setFavorites] = useState<FavoriteCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);

            // Fetch favorite campaigns
            const { data: favoritesData } = await supabase
                .from('favorites')
                .select('*, campaigns(*)')
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

    async function removeFavorite(favoriteId: number) {
        try {
            await supabase
                .from('favorites')
                .delete()
                .eq('id', favoriteId);

            setFavorites(favorites.filter(fav => fav.id !== favoriteId));
        } catch (error) {
            console.error('Error removing favorite:', error);
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
            <aside className="w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0">
                <div className="mb-8 pb-6 border-b border-border">
                    <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">INFLUENCER</div>
                    <div className="text-lg font-bold text-text-main">{profile?.nickname || '사용자'} 님</div>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                    <Link href="/dashboard/influencer" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">대시보드</Link>
                    <Link href="/dashboard/influencer/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">나의 캠페인</Link>
                    <Link href="/dashboard/influencer/favorites" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer bg-rose-50 text-primary">관심 캠페인</Link>
                    <Link href="/dashboard/influencer/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">계정 설정</Link>
                    <Link href="/contact" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">1:1 문의</Link>
                </nav>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-text-main">관심 캠페인</h1>
                    <Link href="/campaigns" className="btn btn-primary text-sm px-4 py-2">캠페인 찾아보기</Link>
                </div>

                {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((fav) => (
                            <div key={fav.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <Link href={`/campaigns/${fav.campaign_id}`}>
                                    {fav.campaigns.thumbnail_url ? (
                                        <img
                                            src={fav.campaigns.thumbnail_url}
                                            alt={fav.campaigns.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">이미지 없음</span>
                                        </div>
                                    )}
                                </Link>
                                <div className="p-5">
                                    <div className="flex gap-2 mb-3">
                                        <span className="text-xs px-2 py-1 rounded bg-rose-50 text-primary font-medium">
                                            {fav.campaigns.platform}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                            {fav.campaigns.category}
                                        </span>
                                    </div>
                                    <Link href={`/campaigns/${fav.campaign_id}`}>
                                        <h3 className="font-bold text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
                                            {fav.campaigns.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {fav.campaigns.description || '설명이 없습니다.'}
                                    </p>
                                    <div className="flex justify-between items-center pt-3 border-t border-border">
                                        <Link
                                            href={`/campaigns/${fav.campaign_id}`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            상세보기
                                        </Link>
                                        <button
                                            onClick={() => removeFavorite(fav.id)}
                                            className="text-sm text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-border rounded-xl p-12 text-center">
                        <p className="text-lg text-gray-500 mb-4">아직 관심 캠페인이 없습니다.</p>
                        <p className="text-sm text-gray-400 mb-6">마음에 드는 캠페인을 찾아 저장해보세요!</p>
                        <Link href="/campaigns" className="btn btn-primary inline-block">
                            캠페인 둘러보기
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
