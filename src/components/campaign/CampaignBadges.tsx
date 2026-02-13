import React from 'react';
import { Instagram, Youtube, MapPin, Package, ShoppingBag, PenTool, Store } from 'lucide-react';

interface BadgeProps {
    className?: string;
    children: React.ReactNode;
}

const BadgeBase = ({ className, children }: BadgeProps) => (
    <div className={`inline-flex items-center justify-center gap-1 sm:gap-1 px-2 sm:px-2.5 h-[22px] rounded-lg text-[10.5px] font-bold leading-none transition-all border shrink-0 ${className}`}>
        {children}
    </div>
);

export const PlatformBadge = ({ platform }: { platform: string }) => {
    const p = platform?.toUpperCase() || '';
    let icon = (
        <div className="w-[11px] h-[11px] flex items-center justify-center overflow-hidden">
            <span className="font-black text-[11.5px] leading-none tracking-tighter translate-y-[0.2px]">N</span>
        </div>
    );
    let label = "블로그";
    let colorClass = "bg-emerald-50 text-emerald-600 border-emerald-100"; // Naver Green Light

    if (p === 'INSTAGRAM' || p === 'REELS') {
        icon = <Instagram size={11} strokeWidth={3} />;
        label = "인스타그램";
        colorClass = "bg-pink-50 text-pink-600 border-pink-100"; // Insta Pink Light
    } else if (p === 'YOUTUBE' || p === 'SHORTS') {
        icon = <Youtube size={11} fill="currentColor" />;
        label = "유튜브";
        colorClass = "bg-red-50 text-red-600 border-red-100"; // YouTube Red Light
    } else if (p === 'TIKTOK') {
        icon = <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
        label = "틱톡";
        colorClass = "bg-slate-100 text-slate-800 border-slate-200";
    } else if (p === 'PURCHASE' || p === 'OTHER' || p === '기타') {
        icon = <ShoppingBag size={11} strokeWidth={3} />;
        label = "구매평";
        colorClass = "bg-orange-50 text-orange-600 border-orange-100"; // Purchase Orange Light
    }

    return (
        <BadgeBase className={`${colorClass}`}>
            <div className="flex-shrink-0 flex items-center justify-center w-[11px] h-[11px]">{icon}</div>
            <span className="hidden sm:inline translate-y-[0.5px] ml-0.5 whitespace-nowrap">{label}</span>
        </BadgeBase>
    );
};

export const TypeBadge = ({ type }: { type?: string }) => {
    if (!type) return null;
    const t = type.toUpperCase();

    let label = "방문";
    let colorClass = "bg-blue-50 text-blue-600 border-blue-100";
    let icon = <Store size={11} />;

    if (t === 'DELIVERY') {
        label = "배송";
        icon = <Package size={11} />;
        colorClass = "bg-indigo-50 text-indigo-600 border-indigo-100";
    } else if (t === 'PURCHASE') {
        label = "구매";
        icon = <ShoppingBag size={11} />;
        colorClass = "bg-orange-50 text-orange-600 border-orange-100";
    } else if (t === 'PRESS') {
        label = "기자단";
        icon = <PenTool size={11} />;
        colorClass = "bg-purple-50 text-purple-600 border-purple-100";
    }

    return (
        <BadgeBase className={colorClass}>
            <span className="flex-shrink-0 flex items-center translate-y-[0.3px]">{icon}</span>
            <span className="hidden sm:inline translate-y-[1px]">{label}</span>
        </BadgeBase>
    );
};

export const RegionBadge = ({ region, sub_region }: { region?: string | null, sub_region?: string | null }) => {
    const displayRegion = [region, sub_region].filter(Boolean).join(' ');
    return (
        <BadgeBase className="bg-slate-50 text-slate-600 border-slate-200 !px-2.5 !gap-1">
            <span className="flex-shrink-0 flex items-center translate-y-[0.3px]"><MapPin size={11} /></span>
            <span className="translate-y-[1px]">{displayRegion || '전국'}</span>
        </BadgeBase>
    );
};

export const DDayBadge = ({ dday }: { dday: string }) => {
    return (
        <span className={`inline-flex items-center justify-center px-2.5 h-[1.4rem] min-w-[2.8rem] rounded-lg text-[10px] font-black shadow-lg shadow-rose-200 transition-all leading-none ${
            dday === '상시'
            ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-orange-200'
            : dday === '종료'
                ? 'bg-slate-800 text-white shadow-slate-200'
                : 'bg-rose-500 text-white'
        }`}>
            <span className="translate-y-[-0.5px]">{dday}</span>
        </span>
    );
};


