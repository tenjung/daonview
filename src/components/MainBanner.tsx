'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Banner {
    id: number;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
}

export default function MainBanner() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [displayBanners, setDisplayBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionEnabled, setTransitionEnabled] = useState(true);
    const [rollingInterval, setRollingInterval] = useState(3000);

    useEffect(() => {
        const fetchBanners = async () => {
            const [bannersRes, configRes] = await Promise.all([
                supabase
                    .from('banners')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true }),
                supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'banner_config')
                    .single()
            ]);

            if (!bannersRes.error && bannersRes.data && bannersRes.data.length > 0) {
                const fetchedBanners = bannersRes.data;
                setBanners(fetchedBanners);
                // Create cloned array for infinite loop: [Last, A, B, C, First]
                setDisplayBanners([
                    fetchedBanners[fetchedBanners.length - 1],
                    ...fetchedBanners,
                    fetchedBanners[0]
                ]);
                // Set initial index to 1 (the first real slide)
                setCurrentIndex(1);
            }
            
            if (!configRes.error && configRes.data?.value?.rolling_interval) {
                setRollingInterval(configRes.data.value.rolling_interval * 1000);
            }

            setLoading(false);
        };
        fetchBanners();
    }, []);

    // Auto rolling
    useEffect(() => {
        if (banners.length <= 1 || isTransitioning) return;
        
        const interval = setInterval(() => {
            handleNext();
        }, rollingInterval);
        
        return () => clearInterval(interval);
    }, [banners.length, currentIndex, rollingInterval, isTransitioning]);

    const handleNext = () => {
        if (isTransitioning) return;
        setTransitionEnabled(true);
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (isTransitioning) return;
        setTransitionEnabled(true);
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    };

    const handleDotClick = (index: number) => {
        if (isTransitioning) return;
        setTransitionEnabled(true);
        setIsTransitioning(true);
        setCurrentIndex(index + 1);
    };

    const handleTransitionEnd = (e: React.TransitionEvent) => {
        // 버블링되는 하위 요소의 transitionend 이벤트 무시 (예: 타이틀 애니메이션)
        if (e.target !== e.currentTarget) return;

        setIsTransitioning(false);
        
        // If we reached the end clone (A'), jump back to real A
        if (currentIndex === displayBanners.length - 1) {
            setTransitionEnabled(false);
            setCurrentIndex(1);
        }
        // If we reached the start clone (C'), jump forward to real C
        else if (currentIndex === 0) {
            setTransitionEnabled(false);
            setCurrentIndex(displayBanners.length - 2);
        }
    };

    if (loading) return (
        <div className="max-w-[1200px] mx-auto overflow-hidden">
            <div className="w-[600px] h-[300px] mx-auto bg-gray-100 animate-pulse relative overflow-hidden rounded-2xl shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-rose-100 border-t-primary rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    );

    if (banners.length === 0) return null;

    // Map the current index to the real dot index
    const activeDotIndex = 
        currentIndex === 0 ? banners.length - 1 :
        currentIndex === displayBanners.length - 1 ? 0 :
        currentIndex - 1;

    return (
        <div className="w-full py-8">
            <section className="relative w-[600px] h-[300px] mx-auto bg-gray-900 overflow-hidden rounded-2xl shadow-2xl group">
                <div 
                    className={`flex h-full ${transitionEnabled ? 'transition-transform duration-700 ease-in-out' : ''}`}
                    style={{ transform: `translateX(-${currentIndex * 600}px)` }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {displayBanners.map((banner, idx) => (
                        <div key={`${banner.id}-${idx}`} className="w-[600px] flex-shrink-0 h-full relative">
                            {/* Background Image with Ken Burns Effect */}
                            <div className="absolute inset-0 overflow-hidden">
                                <img 
                                    src={banner.image_url} 
                                    alt={banner.title} 
                                    className={`w-full h-full object-cover transition-transform ease-linear ${idx === currentIndex ? 'scale-110' : 'scale-100'}`}
                                    style={{ transitionDuration: '10000ms' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex items-center">
                                <div className="px-8 w-full">
                                    <div className={`max-w-sm transition-all duration-1000 delay-300 ${idx === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-8 h-[2px] bg-primary"></span>
                                            <span className="text-primary font-medium tracking-widest text-[10px] uppercase">Recommended Mission</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-white mb-3 leading-tight drop-shadow-2xl">
                                            {banner.title.split('\n').map((line, i) => (
                                                <span key={i} className="block">{line}</span>
                                            ))}
                                        </h2>
                                        <p className="text-sm text-gray-200 mb-6 leading-relaxed font-medium drop-shadow-md line-clamp-2">
                                            {banner.subtitle}
                                        </p>
                                        <div>
                                            <Link 
                                                href={banner.link_url || '/campaigns'} 
                                                className="inline-flex items-center gap-2 bg-primary hover:bg-rose-600 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
                                            >
                                                상세보기 <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                {banners.length > 1 && (
                    <>
                        <button 
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20"
                        >
                            <ChevronRight size={20} />
                        </button>
                        
                        {/* Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            {banners.map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleDotClick(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeDotIndex ? 'w-8 bg-primary' : 'w-1.5 bg-white/50 hover:bg-white'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
