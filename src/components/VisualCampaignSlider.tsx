'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, Instagram, Youtube, PenTool } from 'lucide-react';

interface Campaign {
    id: number | string;
    title: string;
    platform: string;
    type: string;
    imageUrl?: string;
    dday: string;
    region?: string | null;
    provision?: string;
    applicants: number;
    total: number;
}

const VisualPlatformBadge = ({ platform }: { platform: string }) => {
    const p = platform.toUpperCase();
    let icon = <PenTool className="w-3 h-3" />;
    let label = "블로그";
    let colorClass = "bg-emerald-500/90 text-white";

    if (p === 'INSTAGRAM' || p === 'REELS') {
        icon = <Instagram className="w-3 h-3" />;
        label = "인스타그램";
        colorClass = "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    } else if (p === 'YOUTUBE' || p === 'SHORTS') {
        icon = <Youtube className="w-3 h-3" />;
        label = "유튜브";
        colorClass = "bg-red-500/90 text-white";
    } else if (p === 'TIKTOK') {
        icon = <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
        label = "틱톡";
        colorClass = "bg-slate-900 text-white";
    } else if (p === 'PURCHASE' || p === 'OTHER') {
        icon = <Gift className="w-3 h-3" />;
        label = "구매평";
        colorClass = "bg-orange-500/90 text-white";
    }

    return (
        <span className={`${colorClass} backdrop-blur-md px-2.5 py-1 rounded-3xl text-[10px] font-medium flex items-center gap-1 shadow-lg`}>
            {icon}
            <span>{label}</span>
        </span>
    );
};

export default function VisualCampaignSlider({ campaigns }: { campaigns: Campaign[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Ensure we have enough campaigns to scroll (duplicate if needed for smooth loop illusion, strictly speaking simplified for now)
    // To show 2 items, we need at least 2.

    useEffect(() => {
        if (campaigns.length <= 2 || isPaused) return;

        const interval = setInterval(() => {
            // Slide one by one
            setCurrentIndex((prev) => (prev + 1) % (campaigns.length - 1));
        }, 4000);
        return () => clearInterval(interval);
    }, [campaigns.length, isPaused]);

    if (!campaigns || campaigns.length === 0) return null;

    return (
        <div
            className="relative w-full overflow-hidden select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Track */}
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 50}%)` }}
            >
                {campaigns.map((current, idx) => {
                    // Calculate percentage
                    const percentage = current.total > 0 ? Math.min(Math.round((current.applicants / current.total) * 100), 100) : 0;

                    return (
                        <div key={current.id} className="min-w-[50%] px-2">
                            <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-xl bg-gray-900 group select-none cursor-pointer">

                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    {current.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={current.imageUrl}
                                            alt={current.title}
                                            className="w-full h-full object-cover transition-transform duration-[3000ms] ease-linear group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800" />
                                    )}
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />
                                </div>

                                {/* Content Overlay */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                                    {/* Top Row: Tags */}
                                    <div className="flex justify-between items-start w-full">
                                        {current.type === 'VISIT' ? (
                                            current.region ? (
                                                <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-3xl text-xs font-medium border border-white/10">
                                                    {current.region}
                                                </span>
                                            ) : (
                                                <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-3xl text-xs font-medium border border-white/10">
                                                    전국
                                                </span>
                                            )
                                        ) : (
                                            <div /> // Spacer to keep D-Day on the right
                                        )}

                                        <span className="bg-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg shadow-rose-500/30 ml-auto">
                                            {current.dday}
                                        </span>
                                    </div>

                                    {/* Bottom Content */}
                                    <div className="space-y-1.5">
                                        {/* Platform & Type */}
                                        <div className="flex items-center gap-2">
                                            <VisualPlatformBadge platform={current.platform} />
                                            <span className="bg-blue-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-3xl text-[10px] font-medium shadow-lg">
                                                {current.type === 'VISIT' ? '방문' :
                                                    current.type === 'DELIVERY' ? '배송' :
                                                        current.type === 'PURCHASE' ? '구매' :
                                                            current.type === 'PRESS' ? '기자단' : current.type}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <Link href={`/campaigns/${current.id}`} className="block">
                                            <h2 className="text-base md:text-lg font-extrabold text-white leading-tight line-clamp-2 drop-shadow-lg transition-colors hover:text-rose-200">
                                                {current.title}
                                            </h2>
                                        </Link>

                                        {/* Provision */}
                                        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30 backdrop-blur-sm self-start inline-flex max-w-full">
                                            <Gift size={14} className="shrink-0" />
                                            <span className="truncate">{current.provision || '제공내역 별도표기'}</span>
                                        </div>

                                        {/* Progress Bar Section */}
                                        <div className="pt-1">
                                            <div className="flex justify-between text-[10px] text-gray-300 mb-1 font-medium">
                                                <span>신청 <b className="text-white text-xs">{current.applicants}</b>명</span>
                                                <span className="text-rose-300">{percentage}% 달성</span>
                                            </div>
                                            <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm border border-white/10">
                                                <div
                                                    className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Dots */}
            <div className="hidden md:flex absolute top-1/2 right-4 -translate-y-1/2 flex-col gap-2 z-20">
                {campaigns.slice(0, campaigns.length - 1).map((_, idx) => (
                    <div
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${idx === currentIndex ? 'bg-white h-4' : 'bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
}
