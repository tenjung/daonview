'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronRight, Gift, Calendar, ArrowRight } from 'lucide-react';
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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (!error && data && data.length > 0) {
                setBanners(data);
            } else {
                // Fallback or empty
                setBanners([]);
            }
            setLoading(false);
        };
        fetchBanners();
    }, []);

    // Auto rolling
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    if (loading) return (
        <div className="w-full aspect-[21/9] md:aspect-[25/8] bg-gray-100 animate-pulse relative overflow-hidden rounded-b-[40px]">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-rose-100 border-t-primary rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (banners.length === 0) return null;

    return (
        <section className="relative w-full aspect-[16/9] md:aspect-[25/8] bg-gray-900 overflow-hidden rounded-b-[40px] shadow-2xl group">
            <div 
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {banners.map((banner, idx) => (
                    <div key={banner.id} className="min-w-full h-full relative">
                        {/* Background Image with Ken Burns Effect */}
                        <div className="absolute inset-0 overflow-hidden">
                            <img 
                                src={banner.image_url} 
                                alt={banner.title} 
                                className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${idx === currentIndex ? 'scale-110' : 'scale-100'}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="container px-8 md:px-16">
                                <div className={`max-w-2xl transition-all duration-1000 delay-300 ${idx === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-12 h-[2px] bg-primary"></span>
                                        <span className="text-primary font-bold tracking-widest text-sm uppercase">Recommended Mission</span>
                                    </div>
                                    <h2 className="text-3xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-2xl">
                                        {banner.title.split('\n').map((line, i) => (
                                            <span key={i} className="block">{line}</span>
                                        ))}
                                    </h2>
                                    <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed font-medium max-w-lg drop-shadow-md">
                                        {banner.subtitle}
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <Link 
                                            href={banner.link_url || '/campaigns'} 
                                            className="inline-flex items-center gap-2 bg-primary hover:bg-rose-600 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-1"
                                        >
                                            상세보기 <ArrowRight size={20} />
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
                        onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20"
                    >
                        <ChevronRight size={24} />
                    </button>
                    
                    {/* Dots */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                        {banners.map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCurrentIndex(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-10 bg-primary' : 'w-2 bg-white/50 hover:bg-white'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
