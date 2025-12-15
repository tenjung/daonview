import Link from 'next/link';
import { Instagram, Youtube, MapPin, Package, ShoppingBag, Type } from 'lucide-react';

interface CampaignProps {
    id?: number | string;
    title: string;
    platform: string; // 'BLOG' | 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'REELS' | 'SHORTS'
    type?: string;     // 'VISIT' | 'DELIVERY' | 'PURCHASE'
    applicants: number;
    total: number;
    dday: string;
    imageUrl?: string;
    category?: string;
    provision?: string;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
    const p = platform.toUpperCase();
    if (p === 'INSTAGRAM' || p === 'REELS') return <Instagram className="w-4 h-4 text-pink-600" />;
    if (p === 'YOUTUBE' || p === 'SHORTS') return <Youtube className="w-4 h-4 text-red-600" />;
    if (p === 'TIKTOK') return <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
    // Default to Blog (Naver usually) - Green
    return <span className="font-bold text-green-600 text-xs">N</span>;
};

const TypeBadge = ({ type }: { type?: string }) => {
    if (!type) return null;
    const t = type.toUpperCase();

    let icon = <MapPin className="w-3 h-3" />;
    let label = "방문";
    let colorClass = "bg-blue-50 text-blue-600 border-blue-100";

    if (t === 'DELIVERY') {
        icon = <Package className="w-3 h-3" />;
        label = "배송";
        colorClass = "bg-green-50 text-green-600 border-green-100";
    } else if (t === 'PURCHASE') {
        icon = <ShoppingBag className="w-3 h-3" />;
        label = "구매";
        colorClass = "bg-purple-50 text-purple-600 border-purple-100";
    }

    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
            {icon} {label}
        </span>
    );
};

export default function CampaignCard({ id, title, platform, type, applicants, total, dday, imageUrl, provision }: CampaignProps) {
    const linkHref = id ? `/campaigns/${id}` : '#';

    return (
        <Link href={linkHref} className="card group border border-border rounded-xl overflow-hidden bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col no-underline text-text-main h-full">
            <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-amber-50 group-hover:scale-105 transition-transform duration-500" />
                )}

                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur ${dday === '상시모집'
                        ? 'bg-indigo-600 text-white'
                        : dday === '종료'
                            ? 'bg-gray-600 text-white'
                            : 'bg-white/90 text-primary ring-1 ring-black/5'
                        }`}>
                        {dday}
                    </span>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                    {/* Platform Icon Circle */}
                    <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <PlatformIcon platform={platform} />
                    </div>
                    <TypeBadge type={type} />
                </div>

                <h3 className="text-base font-bold mb-2 leading-snug line-clamp-2 number-font group-hover:text-primary transition-colors">
                    {title}
                </h3>

                {provision && (
                    <div className="mb-3 px-2 py-1.5 bg-slate-50 rounded text-sm font-bold text-slate-700 truncate">
                        🎁 {provision}
                    </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-text-secondary">
                    <div className="flex gap-1">
                        <span className="">모집</span>
                        <span className="font-bold text-text-main">{total}명</span>
                    </div>
                    <div className="flex gap-1">
                        <span className="">신청</span>
                        <span className="font-bold text-primary">{applicants}명</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
