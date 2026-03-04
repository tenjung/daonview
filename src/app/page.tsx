import { unstable_cache } from 'next/cache';
import InteractiveRollingBanner from '@/components/InteractiveRollingBanner';
import StaticPromoBanners from '@/components/StaticPromoBanners';
import { getPublicServerClient } from '@/lib/supabase/publicServer';
import { fetchAllBannerData } from '@/lib/bannerUtils';
import CampaignSection from '@/components/home/CampaignSection';
import KakaoBanner from '@/components/KakaoBanner';
import BoardList from '@/components/board/BoardList';
import FeaturesCarousel from '@/components/FeaturesCarousel';

export const revalidate = 60; // ISR: 1분마다 재생성

const fetchLatestNotices = unstable_cache(
    async () => {
        const supabase = getPublicServerClient();
        const { data, error } = await supabase
            .from('notices')
            .select('id, type, title, created_at, view_count')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error('[Home] Notice Fetch Error:', error);
            return [];
        }

        return data ?? [];
    },
    ['home-notice-data-v1'],
    { revalidate: 60, tags: ['home-notices'] }
);

export default async function Home() {
    // Fetch banner items for SSR (includes campaign data)
    const bannerItems = await fetchAllBannerData();

    // Extract campaigns from banner data
    const latestCampaigns = bannerItems
        .filter(item => item.type === 'NEW')
        .slice(0, 4)
        .map(item => ({
            id: item.id.toString().replace('new-', ''),
            title: item.title,
            imageUrl: item.image_url,
            type: item.campaignType || (item.extra_badge === '방문' ? 'VISIT' : 'DELIVERY'),
            provision: item.subtitle || '',
            dday: item.dday || 'D-0',
            applicants: item.applicants || 0,
            total: item.total || 0,
            platform: item.platform || 'BLOG',
            includeReview: item.includeReview || false,
            includeNaver: item.includeNaver || false,
            includeInstagram: item.includeInstagram || false,
            region: item.region || null,
            sub_region: item.sub_region || null,
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
            type: item.campaignType || (item.extra_badge === '방문' ? 'VISIT' : 'DELIVERY'),
            provision: item.subtitle || '',
            dday: item.dday || 'D-0',
            applicants: item.applicants || 0,
            total: item.total || 0,
            platform: item.platform || 'BLOG',
            includeReview: item.includeReview || false,
            includeNaver: item.includeNaver || false,
            includeInstagram: item.includeInstagram || false,
            region: item.region || null,
            sub_region: item.sub_region || null,
            end_date: '',
            created_at: ''
        }));

    const steadyCampaigns = bannerItems
        .filter(item => item.type === 'STEADY')
        .slice(0, 4)
        .map(item => ({
            id: item.id.toString().replace('steady-', ''),
            title: item.title,
            imageUrl: item.image_url,
            type: item.campaignType || (item.extra_badge === '방문' ? 'VISIT' : 'DELIVERY'),
            provision: item.subtitle || '',
            dday: item.dday || '상시',
            applicants: item.applicants || 0,
            total: item.total || 0,
            platform: item.platform || 'BLOG',
            includeReview: item.includeReview || false,
            includeNaver: item.includeNaver || false,
            includeInstagram: item.includeInstagram || false,
            region: item.region || null,
            sub_region: item.sub_region || null,
            end_date: '',
            created_at: ''
        }));

    const notices = await fetchLatestNotices();

    return (
        <div className="bg-background">
            {/* NEW Interactive Rolling Banner System */}
            <InteractiveRollingBanner initialItems={bannerItems} />

            {/* Static Promotional Banners */}
            <StaticPromoBanners />

            <CampaignSection
                badge="NEW ARRIVALS"
                badgeClassName="bg-pink-100 text-primary"
                title="따끈따끈 신규 캠페인"
                titleEmoji="🔥"
                sectionClassName="bg-gradient-to-b from-white to-rose-50 pt-8 pb-8"
                viewAllHref="/campaigns?sort=new"
                viewAllClassName="text-gray-400 hover:text-primary"
                campaigns={latestCampaigns}
            />

            {/* Steady (Always Open) Campaigns Section */}
            {steadyCampaigns.length > 0 && (
                <CampaignSection
                    badge="ALWAYS OPEN"
                    badgeClassName="bg-indigo-100 text-indigo-600"
                    title="언제든지 신청 가능한 꿀 캠페인"
                    titleEmoji="♾️"
                    sectionClassName="bg-gradient-to-b from-rose-50 to-indigo-50 pb-8 pt-8"
                    viewAllHref="/campaigns?sort=steady"
                    viewAllClassName="text-gray-400 hover:text-indigo-600"
                    campaigns={steadyCampaigns}
                />
            )}

            <CampaignSection
                badge="HOT & POPULAR"
                badgeClassName="bg-blue-100 text-blue-600"
                title="인기 폭발! 베스트 체험단"
                titleEmoji="🏆"
                sectionClassName="bg-gradient-to-b from-indigo-50 to-white pb-16 pt-8 border-b border-rose-100"
                viewAllHref="/campaigns?sort=popular"
                viewAllClassName="text-gray-400 hover:text-blue-600"
                campaigns={popularCampaigns}
            />

            {/* KakaoTalk Channel Banner */}
            <KakaoBanner />

            {/* Service Introduction */}
            <section className="bg-white pt-24 pb-0 border-y border-gray-100 mt-8">
                <div className="container px-4 md:px-0">
                    <div className="text-center mb-6 md:mb-8">
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

            {/* Notices & Events */}
            <BoardList
                title="이벤트 & 공지"
                icon="📢"
                items={notices}
                viewAllHref="/community/notice"
                className="md:pt-12"
            />
        </div>
    );
}
