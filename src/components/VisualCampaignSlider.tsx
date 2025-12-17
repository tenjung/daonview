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

    if (p === 'INSTAGRAM' || p === 'REELS') {
        icon = <Instagram className="w-3 h-3" />;
        label = "인스타그램";
    } else if (p === 'YOUTUBE' || p === 'SHORTS') {
        icon = <Youtube className="w-3 h-3" />;
        label = "유튜브";
    } else if (p === 'TIKTOK') {
        icon = <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
        label = "틱톡";
    }

    return (
        <span className="bg-white text-black px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
            {icon}
            <span>{label}</span>
        </span>
    );
};

export default function VisualCampaignSlider({ campaigns }: { campaigns: Campaign[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (campaigns.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % campaigns.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [campaigns.length, isPaused]);

    if (!campaigns || campaigns.length === 0) return null;

    const current = campaigns[currentIndex];

    // Calculate percentage
    const percentage = current.total > 0 ? Math.min(Math.round((current.applicants / current.total) * 100), 100) : 0;

    return (
        <div
            className="relative w-full h-[460px] md:h-[500px] rounded-[32px] overflow-hidden shadow-xl bg-gray-900 group select-none cursor-pointer"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Images Layer */}
            {campaigns.map((cam, idx) => (
                <div
                    key={cam.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
                >
                    {cam.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={cam.imageUrl}
                            alt={cam.title}
                            className="w-full h-full object-cover transition-transform duration-[3000ms] ease-linear scale-100 transform"
                            style={{
                                transform: idx === currentIndex ? 'scale(1.1)' : 'scale(1.0)'
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-800" />
                    )}
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />
                </div>
            ))}

            {/* Content Overlay */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                {/* Top Row: Tags */}
                <div className="flex justify-between items-start">
                    {/* Region */}
                    {current.region ? (
                        <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10">
                            {current.region}
                        </span>
                    ) : (
                        <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10">
                            전국
                        </span>
                    )}

                    {/* D-Day Badge */}
                    <span className="bg-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-rose-500/30">
                        {current.dday}
                    </span>
                </div>

                {/* Bottom Content */}
                <div className="space-y-4 translate-y-0 transition-transform duration-500">
                    {/* Platform & Type */}
                    <div className="flex items-center gap-2 mb-1">
                        <VisualPlatformBadge platform={current.platform} />
                        <span className="text-gray-300 text-sm font-medium drop-shadow-md">
                            {current.type === 'VISIT' ? '방문형' : '배송형'}
                        </span>
                    </div>

                    {/* Title */}
                    <Link href={`/campaigns/${current.id}`} className="block">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight line-clamp-3 mb-2 drop-shadow-lg transition-colors hover:text-rose-200">
                            {current.title}
                        </h2>
                    </Link>

                    {/* Provision */}
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-500/30 backdrop-blur-sm self-start inline-flex">
                        <Gift size={16} className="shrink-0" />
                        <span className="truncate max-w-[280px]">{current.provision || '제공내역 별도표기'}</span>
                    </div>

                    {/* Progress Bar Section */}
                    <div className="pt-2">
                        <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-medium">
                            <span>신청 <b className="text-white text-sm">{current.applicants}</b>명</span>
                            <span className="text-rose-300">{percentage}% 달성</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-white/10">
                            <div
                                className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination Dots (Optional, visual indicator) */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-2 z-20">
                {campaigns.map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white h-4' : 'bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
}
