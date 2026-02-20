import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Instagram, Youtube, MapPin, Package, ShoppingBag, Gift, PenTool, Heart, Store } from 'lucide-react';
import { PlatformBadge, TypeBadge, RegionBadge, DDayBadge } from './campaign/CampaignBadges';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CampaignProps {
    id?: number | string;
    title: string;
    platform: string; // 'BLOG' | 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'REELS' | 'SHORTS' | 'OTHER'
    type?: string;     // 'VISIT' | 'DELIVERY' | 'PURCHASE' | 'PRESS'
    applicants: number;
    total: number;
    dday: string;
    imageUrl?: string;
    category?: string | null;
    provision?: string | null;
    region?: string | null;
    includeReview?: boolean;
    includeNaver?: boolean;
    includeInstagram?: boolean;
    sub_region?: string | null;
}


export default function CampaignCard({ id, title, platform, type, applicants, total, dday, imageUrl, provision, region, sub_region, includeReview, includeNaver, includeInstagram }: CampaignProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const linkHref = id ? `/campaigns/${id}` : '#';
    const isVisit = type?.toUpperCase() === 'VISIT';

    // Calculate percentage
    const isInfinite = total >= 999;
    const percentage = total > 0 ? (isInfinite ? 0 : Math.min(Math.round((applicants / total) * 100), 100)) : 0;

    const { user } = useAuthStore();
    const { addItem, removeItem, isInCart } = useCartStore();
    const isWished = id ? isInCart(id) : false;

    const toggleWish = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!id) return;

        // 1. 로그인 여부 확인
        if (!user) {
            toast.error('로그인이 필요한 기능입니다.', {
                description: '관심 캠페인을 저장하려면 로그인해 주세요.'
            });
            return;
        }

        try {
            if (isWished) {
                // DB에서 삭제
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('campaign_id', id);

                if (error) throw error;

                removeItem(id);
                toast.info('관심 캠페인에서 제거되었습니다.');
            } else {
                // DB에 추가
                const { error } = await supabase
                    .from('favorites')
                    .insert({ user_id: user.id, campaign_id: id });

                if (error) throw error;

                addItem({ id, title, platform, type, imageUrl, provision, applicants, total, dday, region });
                toast.success('관심 캠페인에 저장되었습니다!', {
                    description: '대시보드에서 확인하실 수 있습니다.'
                });
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('오류가 발생했습니다. 다시 시도해 주세요.');
        }
    };

    return (
        <Link href={linkHref} className="card group border border-border rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">
            {/* Image Section */}
            <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.style.backgroundColor = '#f3f4f6';
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <Gift className="w-10 h-10 text-gray-200" />
                    </div>
                )}

                {/* Overlay Elements: D-Day (Left) & Wishlist (Right) */}
                <div className="absolute top-3 left-3 z-10">
                    <DDayBadge dday={dday} />
                </div>

                <div className="absolute top-3 right-3 z-10">
                    <button
                        onClick={toggleWish}
                        className={`p-1.5 rounded-full shadow-xl transition-all duration-300 transform active:scale-75 ${(mounted && isWished)
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/90 backdrop-blur-sm text-gray-400 hover:text-rose-500 hover:bg-white'
                            }`}
                    >
                        <Heart className={`w-3.5 h-3.5 ${(mounted && isWished) ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-2.5 flex flex-col flex-1 gap-1.5">
                {/* 1. Tags: Type & Platform & Region */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <TypeBadge type={type} />

                    {/* 배송형일 경우 명시적인 include 플래그 사용 */}
                    {type?.toUpperCase() === 'DELIVERY' ? (
                        <>
                            {includeReview && <PlatformBadge platform="PURCHASE" />}
                            {includeNaver && <PlatformBadge platform="BLOG" />}
                            {includeInstagram && <PlatformBadge platform="INSTAGRAM" />}
                            {/* 플래그 정보가 하나도 없을 때만 기본 platform 표시 (하위 호환) */}
                            {!includeReview && !includeNaver && !includeInstagram && (
                                <PlatformBadge platform={platform} />
                            )}
                        </>
                    ) : (
                        <PlatformBadge platform={platform} />
                    )}

                    {isVisit && (
                        <RegionBadge region={region} sub_region={sub_region} />
                    )}
                </div>

                {/* 2. Title */}
                <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                {/* 3. Provision */}
                <div className="flex flex-col gap-1 text-[11px] text-gray-500 items-start">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 leading-none">
                        제공내역
                    </span>
                    <span className="line-clamp-1 text-slate-600 pl-0.5 font-medium">{provision || '제공내역 정보가 없습니다.'}</span>
                </div>

                {/* Spacer to push bottom section down */}
                <div className="mt-auto pt-1.5 border-t border-gray-50 text-slate-800">
                    {/* 4. Progress Section */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        {/* Percentage or ON Indicator */}
                        {isInfinite ? (
                            <div className="flex items-center gap-1.5 font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                ON
                            </div>
                        ) : (
                            <span className="font-bold text-blue-600">{percentage}%</span>
                        )}

                        {/* Count Text */}
                        <span className="text-gray-400 font-medium">
                            <b className="text-gray-900">{applicants}</b> <span className="text-[10px] text-gray-300">/</span> {isInfinite ? <span className="text-indigo-600 font-black">∞</span> : <>{total}명</>}
                        </span>
                    </div>

                    {/* Progress Bar (Infinite Wave for isInfinite) */}
                    <div className={`w-full ${isInfinite ? 'bg-indigo-50' : 'bg-gray-100'} rounded-full h-1.5 overflow-hidden relative`}>
                        {isInfinite ? (
                            <div className="absolute inset-0 w-full h-full">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-rose-400 to-indigo-400 w-[200%] h-full animate-[shimmer_2s_linear_infinite]"
                                    style={{
                                        backgroundImage: 'linear-gradient(90deg, #818cf8 0%, #fb7185 50%, #818cf8 100%)',
                                        backgroundSize: '200% 100%'
                                    }}
                                />
                            </div>
                        ) : (
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Link >
    );
}
