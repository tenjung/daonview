import Link from 'next/link';
import { Puzzle, Rocket, Shield, BarChart3 } from 'lucide-react';
import CampaignCard from '@/components/CampaignCard';
import InteractiveRollingBanner from '@/components/InteractiveRollingBanner';
import StaticPromoBanners from '@/components/StaticPromoBanners';
import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import { fetchAllBannerData } from '@/lib/bannerUtils';
import CampaignSkeleton from '@/components/CampaignSkeleton';
import CampaignCarousel from '@/components/CampaignCarousel';
import KakaoBanner from '@/components/KakaoBanner';
import BoardList from '@/components/board/BoardList';
import FeaturesCarousel from '@/components/FeaturesCarousel';

export const revalidate = 60; // ISR: 1분마다 재생성


export default async function Home() {
    // Fetch banner items for SSR (includes campaign data)
    const bannerItems = await fetchAllBannerData();

    // Extract campaigns from banner data (no duplicate queries!)
    const latestCampaigns = bannerItems
        .filter(item => item.type === 'NEW')
        .slice(0, 4)
        .map(item => ({
            id: item.id.toString().replace('new-', ''),
            title: item.title,
            imageUrl: item.image_url,
            type: item.extra_badge === '방문' ? 'VISIT' : 'DELIVERY',
            provision: item.subtitle || '',
            dday: 'D-7', // Placeholder, will be calculated in CampaignCard
            applicants: item.applicants || 0,  // 🟢 배너 데이터에서 가져옴
            platform: 'BLOG',
            region: '',
            end_date: '',
            created_at: ''
        }));

    const popularCampaigns = bannerItems
        .filter(item => item.type === 'POPULAR')
        .slice(0, 4)
        .map(item => ({
            id: item.id.toString().replace('pop-', ''),
            title: item.title,
            imageUrl: item.image_url,
            type: item.extra_badge === '방문' ? 'VISIT' : 'DELIVERY',
            provision: item.subtitle || '',
            dday: 'D-7',
            applicants: item.applicants || 0,  // 🟢 배너 데이터에서 가져옴
            platform: 'BLOG',
            region: '',
            end_date: '',
            created_at: ''
        }));

    // Fetch latest notices from database
    const { data: noticesData, error: noticeFetchError } = await supabase
        .from('notices')
        .select('id, type, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    if (noticeFetchError) {
        console.error('[Home] Notice Fetch Error:', noticeFetchError);
    }

    const notices = noticesData || [];

    return (
        <div className="bg-background">
            {/* NEW Interactive Rolling Banner System */}
            <InteractiveRollingBanner initialItems={bannerItems} />

            {/* Static Promotional Banners */}
            <StaticPromoBanners />

            {/* New Campaigns Section (4 items) */}
            <section className="bg-gradient-to-b from-white to-rose-50 pt-8 pb-8">
                <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="inline-block bg-pink-100 text-primary px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider">NEW ARRIVALS</span>
                            <h2 className="text-xl md:text-3xl font-black text-text-main flex items-center gap-2">
                                따끈따끈 신규 캠페인 <span className="text-primary">🔥</span>
                            </h2>
                        </div>
                        <Link href="/campaigns?sort=new" className="text-sm font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1 group">
                            전체보기 <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                        </Link>
                    </div>
                    <CampaignCarousel
                        campaigns={latestCampaigns}
                        maxItems={4}
                        showNavigation={false}
                    />
                </div>
            </section>

            {/* Popular Campaigns Section (4 items) */}
            <section className="bg-gradient-to-b from-rose-50 to-white pb-16 pt-8 border-b border-rose-100">
                <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider">HOT & POPULAR</span>
                            <h2 className="text-xl md:text-3xl font-black text-text-main flex items-center gap-2">
                                인기 폭발! 베스트 체험단 <span className="text-amber-400">🏆</span>
                            </h2>
                        </div>
                        <Link href="/campaigns?sort=popular" className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 group">
                            전체보기 <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                        </Link>
                    </div>
                    <CampaignCarousel
                        campaigns={popularCampaigns}
                        maxItems={4}
                        showNavigation={false}
                    />
                </div>
            </section>

            {/* KakaoTalk Channel Banner */}
            <KakaoBanner />

            {/* Service Introduction - Updated to match Intro Page */}
            <section className="bg-white py-24 border-y border-gray-100 mt-8">
                <div className="container px-4 md:px-0">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 leading-tight whitespace-pre-wrap md:whitespace-normal">
                            인플루언서의 시간을 가치 있게,<br className="md:hidden" /> 성장을 확실하게 <span className="text-primary inline-block animate-bounce">🚀</span>
                        </h2>
                        <p className="text-lg md:text-xl text-text-secondary font-medium whitespace-pre-wrap md:whitespace-normal">
                            AI 콘텐츠 생성부터 영향력 진단까지, <br className="md:hidden" />다온뷰가 인플루언서의 성장을 끝까지 책임집니다.
                        </p>
                    </div>

                    <FeaturesCarousel />
                </div>
            </section>

            {/* Notices & Events - Integrated with Shared BoardList Component */}
            <BoardList 
                title="이벤트 & 공지" 
                icon="📢" 
                items={notices} 
                viewAllHref="/community/notice" 
            />
        </div>
    );
}
