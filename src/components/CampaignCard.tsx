import Link from 'next/link';
import { Instagram, Youtube, MapPin, Package, ShoppingBag, Gift, PenTool } from 'lucide-react';

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
export const PlatformBadge = ({ platform }: { platform: string }) => {
    const p = platform.toUpperCase();
    let icon = <PenTool className="w-3 h-3" />;
    let label = "블로그";
    let colorClass = "bg-emerald-100 text-emerald-700"; // Default Naver

    if (p === 'INSTAGRAM' || p === 'REELS') {
        icon = <Instagram className="w-3 h-3" />;
        label = "인스타그램";
        colorClass = "bg-pink-100 text-pink-700";
    } else if (p === 'YOUTUBE' || p === 'SHORTS') {
        icon = <Youtube className="w-3 h-3" />;
        label = "유튜브";
        colorClass = "bg-red-100 text-red-700";
    } else if (p === 'TIKTOK') {
        icon = <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
        label = "틱톡";
        colorClass = "bg-slate-900 text-white";
    } else if (p === 'PURCHASE' || p === 'OTHER' || p === '기타') {
        icon = <ShoppingBag className="w-3 h-3" />;
        label = "구매평";
        colorClass = "bg-orange-100 text-orange-700";
    }

    return (
        <div className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${colorClass}`}>
            {icon}
            <span className="leading-none pt-[1px]">{label}</span>
        </div>
    );
};

export const TypeBadge = ({ type }: { type?: string }) => {
    if (!type) return null;
    const t = type.toUpperCase();

    let label = "방문";
    let colorClass = "bg-blue-100 text-blue-700";
    let icon = <MapPin className="w-3 h-3" />;

    if (t === 'DELIVERY') {
        label = "배송";
        icon = <Package className="w-3 h-3" />;
        colorClass = "bg-indigo-100 text-indigo-700";
    } else if (t === 'PURCHASE') {
        label = "구매";
        icon = <ShoppingBag className="w-3 h-3" />;
        colorClass = "bg-orange-100 text-orange-700";
    } else if (t === 'PRESS') {
        label = "기자단";
        icon = <PenTool className="w-3 h-3" />;
        colorClass = "bg-purple-100 text-purple-700";
    }

    return (
        <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${colorClass}`}>
            {icon}
            <span className="leading-none pt-[1px]">{label}</span>
        </span>
    );
};

export default function CampaignCard({ id, title, platform, type, applicants, total, dday, imageUrl, provision, region }: CampaignProps) {
    const linkHref = id ? `/campaigns/${id}` : '#';
    const isVisit = type?.toUpperCase() === 'VISIT';

    // Calculate percentage
    const percentage = total > 0 ? Math.min(Math.round((applicants / total) * 100), 100) : 0;

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
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                )}

                {/* Top Right: D-Day (Optional but recommended) */}
                <div className="absolute top-3 right-3 z-10">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm ${dday === '상시모집'
                        ? 'bg-indigo-600 text-white'
                        : dday === '종료'
                            ? 'bg-gray-800 text-white'
                            : 'bg-rose-500 text-white'
                        }`}>
                        {dday}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1 gap-2">
                {/* 1. Tags: Type & Platform & Region */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 1. Badge Order: Type -> (Purchase if Delivery) -> Platform -> Region */}
                    <TypeBadge type={type} />

                    {/* Special Rule: For Delivery campaigns, insert 'Purchase' badge if not already main platform */}
                    {type?.toUpperCase() === 'DELIVERY' && platform.toUpperCase() !== 'PURCHASE' && (
                        <PlatformBadge platform="PURCHASE" />
                    )}

                    <PlatformBadge platform={platform} />

                    {isVisit && platform !== 'PURCHASE' && (
                        region ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-gray-500 font-medium border border-gray-100 bg-gray-50">
                                <MapPin className="w-3 h-3" />
                                {region}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-gray-500 font-medium border border-gray-100 bg-gray-50">
                                <MapPin className="w-3 h-3" />
                                전국
                            </span>
                        )
                    )}
                </div>

                {/* 2. Title */}
                <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mt-1 mb-1 group-hover:text-primary transition-colors h-[40px]">
                    {title}
                </h3>

                {/* 3. Provision */}
                <div className="flex flex-col gap-1.5 text-xs text-gray-500 mb-3 items-start">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 leading-none">
                        제공내역
                    </span>
                    <span className="line-clamp-1 text-slate-600 pl-0.5">{provision || '제공내역 없음'}</span>
                </div>

                {/* Spacer to push bottom section down */}
                <div className="mt-auto pt-3 border-t border-gray-50">
                    {/* 4. Progress Section */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
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
