import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Instagram, Youtube, MapPin, Package, ShoppingBag, Gift, PenTool, Heart, Store } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
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
}

// Exported Badge Components for reuse
const badgeBaseClass = "inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold leading-none transition-all";

export const PlatformBadge = ({ platform }: { platform: string }) => {
    const p = platform.toUpperCase();
    let icon = <PenTool size={11} />;
    let label = "블로그";
    let colorClass = "bg-emerald-50 text-emerald-600 border border-emerald-100"; // Default Naver

    if (p === 'INSTAGRAM' || p === 'REELS') {
        icon = <Instagram size={11} />;
        label = "인스타그램";
        colorClass = "bg-pink-50 text-pink-600 border border-pink-100";
    } else if (p === 'YOUTUBE' || p === 'SHORTS') {
        icon = <Youtube size={11} />;
        label = "유튜브";
        colorClass = "bg-red-50 text-red-600 border border-red-100";
    } else if (p === 'TIKTOK') {
        icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
        label = "틱톡";
        colorClass = "bg-slate-900 text-white";
    } else if (p === 'PURCHASE' || p === 'OTHER' || p === '기타') {
        icon = <ShoppingBag size={11} />;
        label = "구매평";
        colorClass = "bg-orange-50 text-orange-600 border border-orange-100";
    }

    return (
        <div className={`${badgeBaseClass} ${colorClass}`}>
            {icon}
            <span>{label}</span>
        </div>
    );
};

export const TypeBadge = ({ type }: { type?: string }) => {
    if (!type) return null;
    const t = type.toUpperCase();

    let label = "방문";
    let colorClass = "bg-blue-50 text-blue-600 border border-blue-100";
    let icon = <Store size={11} />;

    if (t === 'DELIVERY') {
        label = "배송";
        icon = <Package size={11} />;
        colorClass = "bg-indigo-50 text-indigo-600 border border-indigo-100";
    } else if (t === 'PURCHASE') {
        label = "구매";
        icon = <ShoppingBag size={11} />;
        colorClass = "bg-orange-50 text-orange-600 border border-orange-100";
    } else if (t === 'PRESS') {
        label = "기자단";
        icon = <PenTool size={11} />;
        colorClass = "bg-purple-50 text-purple-600 border border-purple-100";
    }

    return (
        <span className={`${badgeBaseClass} ${colorClass}`}>
            {icon}
            <span>{label}</span>
        </span>
    );
};

export const RegionBadge = ({ region }: { region?: string | null }) => {
    return (
        <span className={`${badgeBaseClass} bg-slate-50 text-slate-600 border border-slate-200`}>
            <MapPin size={11} />
            <span>{region || '전국'}</span>
        </span>
    );
};

export default function CampaignCard({ id, title, platform, type, applicants, total, dday, imageUrl, provision, region }: CampaignProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const linkHref = id ? `/campaigns/${id}` : '#';
    const isVisit = type?.toUpperCase() === 'VISIT';

    // Calculate percentage
    const percentage = total > 0 ? Math.min(Math.round((applicants / total) * 100), 100) : 0;

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

                {/* Top Right: D-Day & Wishlist */}
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm ${dday === '상시모집'
                        ? 'bg-indigo-600 text-white'
                        : dday === '종료'
                            ? 'bg-gray-800 text-white'
                            : 'bg-rose-500 text-white'
                        }`}>
                        {dday}
                    </span>
                    <button
                        onClick={toggleWish}
                        className={`p-2 rounded-full shadow-lg transition-all duration-300 ${(mounted && isWished)
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-rose-500 hover:bg-white'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${(mounted && isWished) ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-2.5 flex flex-col flex-1 gap-1.5">
                {/* 1. Tags: Type & Platform & Region */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 1. Badge Order: Type -> (Purchase if Delivery) -> Platform -> Region */}
                    <TypeBadge type={type} />

                    {/* Special Rule: For Delivery campaigns, insert 'Purchase' badge if not already main platform */}
                    {type?.toUpperCase() === 'DELIVERY' && platform.toUpperCase() !== 'PURCHASE' && (
                        <PlatformBadge platform="PURCHASE" />
                    )}

                    <PlatformBadge platform={platform} />

                    {isVisit && (
                        <RegionBadge region={region} />
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
                <div className="mt-auto pt-1.5 border-t border-gray-50">
                    {/* 4. Progress Section */}
                    <div className="flex items-center justify-between text-xs mb-1">
                        {/* Percentage Text */}
                        <span className="font-bold text-blue-600">{percentage}%</span>
                        {/* Count Text */}
                        <span className="text-gray-400 font-medium">
                            <b className="text-gray-900">{applicants}</b> <span className="text-[10px] text-gray-300">/</span> {total}명
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </Link>
    );
}
