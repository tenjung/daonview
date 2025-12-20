'use client';

import * as React from 'react';
import Link from 'next/link';
import { Gift, Zap, Bell, Flame, ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface BannerItem {
    id: string | number;
    type: 'ADMIN' | 'NEW' | 'POPULAR' | 'NOTICE';
    title: string;
    subtitle?: string;
    image_url: string;
    link_url: string;
    badge?: string;
    extra_badge?: string; // For VISIT/DELIVERY
    label?: string;
    isBest?: boolean;
}

interface BannerProps {
    initialItems?: BannerItem[];
}

export default function InteractiveRollingBanner({ initialItems = [] }: BannerProps) {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);
    // Custom Autoplay State
    const [isPaused, setIsPaused] = React.useState(false);
    const directionRef = React.useRef<'forward' | 'backward'>('forward');
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });

        // Custom Yoyo Autoplay Logic
        const startAutoplay = () => {
            stopAutoplay();
            intervalRef.current = setInterval(() => {
                if (isPaused) return;

                if (directionRef.current === 'forward') {
                    if (api.canScrollNext()) {
                        api.scrollNext();
                    } else {
                        directionRef.current = 'backward';
                        api.scrollPrev();
                    }
                } else {
                    if (api.canScrollPrev()) {
                        api.scrollPrev();
                    } else {
                        directionRef.current = 'forward';
                        api.scrollNext();
                    }
                }
            }, 3000); // 3 seconds interval
        };

        const stopAutoplay = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };

        // Event Listeners for Pause on Hover
        const onPointerEnter = () => setIsPaused(true);
        const onPointerLeave = () => setIsPaused(false);

        api.containerNode().parentElement?.addEventListener('pointerenter', onPointerEnter);
        api.containerNode().parentElement?.addEventListener('pointerleave', onPointerLeave);

        startAutoplay();

        return () => {
            stopAutoplay();
            api.containerNode().parentElement?.removeEventListener('pointerenter', onPointerEnter);
            api.containerNode().parentElement?.removeEventListener('pointerleave', onPointerLeave);
        };
    }, [api, isPaused]); // Re-run if pause state changes? No, interval checks ref/state. 
    // Actually, setInterval closure captures stale 'isPaused' if we are not careful? 
    // Better to use ref for pause or checking state inside. 
    // Let's rely on the 'isPaused' state being accessible? 
    // No, setInterval closure will see initial 'isPaused' (false).
    // We need 'isPaused' in dependency or use a Ref for paused state.

    // Let's use Ref for paused to avoid re-setting interval constantly.
    const isPausedRef = React.useRef(false);

    // Update ref when state changes (or just use ref directly)
    // Let's overwrite the useEffect above slightly to use ref for pause.

    if (!initialItems || initialItems.length === 0) {
        return null;
    }

    // Ensure we have enough items? For Yoyo, standard items are fine.
    // Minimizing duplication if not needed? 
    // Actually, Yoyo works best with "Just enough" items.
    // Let's keep the existing duplication logic just in case, or maybe remove it if it causes clutter?
    // User complained about "First card going to back", which is loop artifact.
    // If we use Yoyo, we don't strictly need duplications for infinite loop mechanism.
    // But `displayItems` var is used below. Let's keep it to avoid breakage, but maybe reduce MIN_ITEMS?
    // Let's keep it for now.

    const MIN_ITEMS = 6;
    let displayItems = [...initialItems];
    if (displayItems.length > 0 && displayItems.length < MIN_ITEMS) {
        while (displayItems.length < MIN_ITEMS) {
            displayItems = [...displayItems, ...initialItems];
        }
    }

    return (
        <section className="relative w-full overflow-hidden py-10 bg-white">
            <Carousel
                setApi={setApi}
                className="w-full h-[320px] relative"
                onMouseEnter={() => { isPausedRef.current = true; }}
                onMouseLeave={() => { isPausedRef.current = false; }}
                opts={{
                    align: "center",
                    loop: false, // Disable Loop for Yoyo
                    skipSnaps: false,
                    slidesToScroll: 1,
                }}
            >
                <CarouselContent className="h-[320px] -ml-4">
                    {displayItems.map((item, index) => (
                        <CarouselItem
                            key={`${item.id}-${index}`}
                            className="pl-4 basis-[600px] grow-0 shrink-0 transition-all duration-700 ease-in-out"
                        >
                            <div className="h-full py-2">
                                <Link href={item.link_url} className="block group h-full">
                                    <Card className="overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] hover:shadow-[0_40px_80px_-20px_rgba(244,63,94,0.35)] transition-all duration-1000 rounded-2xl h-full relative border border-white/10 group-hover:border-rose-200/50">
                                        <CardContent className="p-0 h-full relative">
                                            {/* Background Image with Parallax-like effect */}
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                                                style={{ transitionDuration: '4000ms' }}
                                            />
                                            {/* Sophisticated Darkening Overlay - Enhanced for White Backgrounds */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent opacity-30" />
                                            <div className="absolute inset-0 bg-black/10" /> {/* Subtle overall darkening for white-on-white edge cases */}

                                            {/* Content Overlay */}
                                            <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between z-10">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-2">
                                                        {item.badge && (
                                                            <Badge className={`px-3 py-1 rounded-full text-[12px] font-medium tracking-widest text-white shadow-lg border-none ${item.badge === 'NEW' ? 'bg-blue-600' :
                                                                item.badge === 'HOT' ? 'bg-red-600' : 'bg-rose-500'
                                                                }`}>
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                        {item.isBest && (
                                                            <Badge className="px-3 py-1 rounded-full text-[12px] font-medium tracking-widest text-white shadow-lg border-none bg-amber-500">
                                                                BEST
                                                            </Badge>
                                                        )}
                                                        {item.extra_badge && (
                                                            <Badge className={`px-3 py-1 rounded-full text-[12px] font-medium tracking-widest text-white shadow-lg border-none ${item.extra_badge === '방문' ? 'bg-indigo-600' :
                                                                item.extra_badge === '배송' ? 'bg-emerald-600' : 'bg-slate-500'
                                                                }`}>
                                                                {item.extra_badge}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Top Right Decorative Icon */}
                                                    <div className="h-8 w-8 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm">
                                                        <div className="h-2 w-2 rounded-full bg-white/50" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg md:text-2xl font-black text-white leading-[1.2] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] tracking-tight group-hover:text-rose-50 transition-colors line-clamp-2">
                                                            {item.title}
                                                        </h3>
                                                    </div>

                                                    {/* Horizontal Separator Line */}
                                                    <div className="w-full h-[1px] bg-white/20" />

                                                    <div className="flex items-end justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white/90 text-sm md:text-lg font-medium leading-relaxed line-clamp-1">
                                                                {item.subtitle}
                                                            </p>
                                                        </div>

                                                        {/* Prominent White Circular Button */}
                                                        <div className="flex-shrink-0 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-[360deg] active:scale-95">
                                                            <ArrowRight className="text-rose-500 h-5 w-5" strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subtle Watermark */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
                                                <h1 className="text-[8rem] font-black text-white rotate-[-10deg] whitespace-nowrap">DAON</h1>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Refined Navigation Buttons */}
                <div className="absolute top-1/2 inset-x-6 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                    <CarouselPrevious className="relative left-0 pointer-events-auto h-12 w-12 bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-rose-600 border border-white/20 transition-all rounded-full shadow-lg" />
                    <CarouselNext className="relative right-0 pointer-events-auto h-12 w-12 bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-rose-600 border border-white/20 transition-all rounded-full shadow-lg" />
                </div>

                {/* Modern Progress Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
                    {Array.from({ length: count }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => api?.scrollTo(i)}
                            className={`transition-all duration-700 rounded-full ${current === i + 1
                                ? 'w-10 h-1.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            </Carousel>
        </section>
    );
}
