'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import Link from 'next/link';
import { Gift, Zap, Bell, Flame } from 'lucide-react';

interface BannerItem {
    id: string | number;
    type: 'ADMIN' | 'NEW' | 'POPULAR' | 'NOTICE';
    title: string;
    subtitle?: string;
    image_url: string;
    link_url: string;
    badge?: string;
    label?: string;
}

export default function InteractiveRollingBanner() {
    const [items, setItems] = useState<BannerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchAllBannerData();
    }, []);

    async function fetchAllBannerData() {
        try {
            setLoading(true);
            
            // 1. Fetch banner configuration from site_settings (with fallback)
            let newCount = 4;
            let hotCount = 4;
            
            try {
                const { data: configData, error: configError } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'banner_config')
                    .single();

                if (configError) {
                    console.warn('Banner config not found, using defaults:', configError.message);
                } else if (configData?.value) {
                    newCount = configData.value.new_count || 4;
                    hotCount = configData.value.hot_count || 4;
                }
            } catch (configErr) {
                console.warn('Failed to fetch banner config, using defaults');
            }

            // 2. Parallel Fetch with dynamic limits based on config
            const [bannersRes, latestRes, popularRes] = await Promise.all([
                supabase.from('banners').select('*').eq('is_active', true).order('display_order', { ascending: true }),
                supabase.from('campaigns').select('*, applications(count)').in('status', ['RECRUITING', 'ONGOING']).order('created_at', { ascending: false }).limit(newCount),
                supabase.from('campaigns').select('*, applications(count)').in('status', ['RECRUITING', 'ONGOING']).limit(Math.max(hotCount * 2, 10))
            ]);

            // 3. Process Admin Banners (Ignore error if table doesn't exist yet)
            const adminItems: BannerItem[] = (bannersRes.data || []).map(b => ({
                id: `admin-${b.id}`,
                type: 'ADMIN',
                title: b.title,
                subtitle: b.subtitle,
                image_url: b.image_url,
                link_url: b.link_url || '#',
                badge: 'SPECIAL',
                label: '다온 PICK'
            }));

            // 4. Process Latest Campaigns (using configured count)
            const newItems: BannerItem[] = (latestRes.data || [])
                .map(c => {
                    const mapped = mapCampaignToCard(c as any);
                    return {
                        id: `new-${c.id}`,
                        type: 'NEW' as const,
                        title: mapped.title,
                        subtitle: mapped.provision || '신규 체험 캠페인',
                        image_url: mapped.imageUrl || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&h=600&fit=crop',
                        link_url: `/campaigns/${c.id}`,
                        badge: 'NEW',
                        label: mapped.type === 'VISIT' ? '방문하는 캠페인' : '배송받는 캠페인'
                    };
                })
                .filter(item => item.image_url && item.title);

            // 5. Process Popular Campaigns (using configured count)
            const popularItems: BannerItem[] = (popularRes.data || [])
                .map(c => mapCampaignToCard(c as any))
                .sort((a, b) => (b.applicants || 0) - (a.applicants || 0))
                .slice(0, hotCount)
                .map(mapped => ({
                    id: `pop-${mapped.id}`,
                    type: 'POPULAR' as const,
                    title: mapped.title,
                    subtitle: mapped.provision || '인기 폭발 캠페인',
                    image_url: mapped.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
                    link_url: `/campaigns/${mapped.id}`,
                    badge: 'HOT',
                    label: '베스트 캠페인'
                }))
                .filter(item => item.image_url && item.title);

            // Combine all
            const combined = [...adminItems, ...newItems, ...popularItems];
            
            console.log('Banner data loaded:', {
                admin: adminItems.length,
                new: newItems.length,
                popular: popularItems.length,
                total: combined.length
            });
            
            // Duplicate multiple times for smooth infinite loop
            if (combined.length > 0) {
                setItems([...combined, ...combined, ...combined]);
            } else {
                console.warn('No banner items found');
                setItems([]);
            }
        } catch (err) {
            console.error('Error fetching banner data:', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-b-3xl"></div>;
    }

    if (items.length === 0) return null;

    return (
        <section className="relative w-full overflow-hidden py-10 bg-white">
            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .banner-track {
                    display: flex;
                    width: max-content;
                    animation: scroll 60s linear infinite;
                }
                .banner-track:hover {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="banner-track">
                {items.map((item, index) => (
                    <div 
                        key={`${item.id}-${index}`} 
                        className="w-[450px] h-[300px] px-3 shrink-0"
                    >
                        <Link href={item.link_url} className="block w-full h-full relative rounded-3xl overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-500">
                            {/* Background Image */}
                            <img 
                                src={item.image_url} 
                                alt={item.title} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            
                            {/* Badges & Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                <div className="flex justify-between items-start">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                        item.badge === 'HOT' ? 'bg-red-600' : 
                                        item.badge === 'NEW' ? 'bg-blue-600' : 'bg-primary'
                                    }`}>
                                        {item.badge}
                                    </span>
                                    {item.type === 'NOTICE' && <Bell className="text-white w-5 h-5 drop-shadow-md" />}
                                    {item.type === 'POPULAR' && <Flame className="text-red-500 w-5 h-5 drop-shadow-md animate-pulse" />}
                                </div>

                                <div>
                                    <p className="text-white/80 text-xs font-bold mb-1 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                        {item.label}
                                    </p>
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-rose-200 text-sm font-bold truncate max-w-[250px]">
                                            {item.subtitle}
                                        </p>
                                        <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold group-hover:bg-primary transition-colors">
                                            상세보기
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute bottom-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                                {item.type === 'NEW' && <Zap className="text-yellow-400 w-12 h-12" />}
                                {item.type === 'ADMIN' && <Gift className="text-primary w-12 h-12" />}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}
