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
                className="w-full h-[300px] relative"
                onMouseEnter={() => { isPausedRef.current = true; }}
                onMouseLeave={() => { isPausedRef.current = false; }}
                opts={{
                    align: "center",
                    loop: false, // Disable Loop for Yoyo
                    skipSnaps: false,
                    slidesToScroll: 1,
                }}
            >
                <CarouselContent className="h-[300px] -ml-4">
                    {displayItems.map((item, index) => (
                        <CarouselItem
                            key={`${item.id}-${index}`}
                            className="pl-4 basis-[500px] grow-0 shrink-0 transition-all duration-700 ease-in-out"
                        >
                            <div className="h-full py-2">
                                <Link href={item.link_url} className="block group h-full">
                                    <Card className="overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] hover:shadow-[0_40px_80px_-20px_rgba(244,63,94,0.35)] transition-all duration-1000 rounded-2xl h-full relative border border-white/10 group-hover:border-rose-200/50">
                                        <CardContent className="p-0 h-full relative">
                                            {/* Background Image with Parallax-like effect */}
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            {/* Badges Overlay (Top) */}
                                            <div className="absolute inset-x-0 top-0 p-4 md:p-6 z-10">
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
                                            </div>

                                            {/* Premium Glass Bar (Bottom) - Plan A */}
                                            <div className="absolute inset-x-0 bottom-0 py-1.5 md:py-2 px-4 md:px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 z-10 transition-all duration-500">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white leading-tight tracking-tight line-clamp-1 flex-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                        {item.title}
                                                    </h3>

                                                    {/* Prominent White Circular Button */}
                                                    <div className="flex-shrink-0 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-[360deg] active:scale-95">
                                                        <ArrowRight className="text-rose-500 h-5 w-5" strokeWidth={3} />
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

                {/* Modern Slim Progress Bar - Plan B */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[200px] h-[2px] bg-white/20 z-20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-rose-500 transition-all duration-500 ease-out"
                        style={{ width: `${(current / count) * 100}%` }}
                    />
                </div>
            </Carousel>
        </section>
    );
}
