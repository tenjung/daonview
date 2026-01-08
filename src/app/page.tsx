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

export const revalidate = 0;

export default async function Home() {
    // 1. Latest Campaigns (Limited to 4)
    const { data: latestData } = await supabase
        .from('campaigns')
        .select('*')
        .in('status', ['RECRUITING', 'ONGOING'])
        .order('created_at', { ascending: false })
        .limit(4);

    const latestCampaigns = (latestData || []).map(c => mapCampaignToCard(c as any));

    // 3. Popular Campaigns (Sorted by application count, top 4)
    const { data: popularRawData } = await supabase
        .from('campaigns')
        .select('*')
        .in('status', ['RECRUITING', 'ONGOING'])
        .limit(20);

    const popularCampaigns = (popularRawData || [])
        .map(c => mapCampaignToCard(c as any))
        .sort((a, b) => (b.applicants || 0) - (a.applicants || 0))
        .slice(0, 4);

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

    // Fetch banner items for SSR
    const bannerItems = await fetchAllBannerData();

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
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-text-main mb-4">DAONVIEW는 무엇이 다른가요?</h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            브랜드 성장을 위한 <span className="font-bold text-primary">최고의</span> 파트너가 되어드립니다
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-[1200px] mx-auto">
                        {[
                            {
                                icon: Puzzle,
                                title: '브랜드 맞춤형 매칭',
                                subtitle: 'Brand Fit',
                                description: '단순 방문자 수보다 중요한 건 \'브랜드와의 결\'입니다. 귀사의 감성과 딱 맞는 블로거를 찾아 연결합니다.',
                                gradient: 'from-pink-500 to-rose-500',
                                borderColor: 'border-pink-200 hover:border-pink-400'
                            },
                            {
                                icon: Rocket,
                                title: '지체 없는 캠페인 런칭',
                                subtitle: 'Quick Start',
                                description: '불필요한 대기 시간을 시스템으로 줄였습니다. 신청 즉시 빠르게 모집이 시작되는 신속 프로세스.',
                                gradient: 'from-orange-500 to-red-500',
                                borderColor: 'border-orange-200 hover:border-orange-400'
                            },
                            {
                                icon: Shield,
                                title: '법적 보호 솔루션',
                                subtitle: 'Legal Protection',
                                description: '먹튀/잠수 걱정 NO. 불량 리뷰어 필터링은 기본, 제휴 법무법인을 통해 연락 두절까지 책임지고 해결합니다.',
                                gradient: 'from-blue-600 to-indigo-600',
                                borderColor: 'border-blue-200 hover:border-blue-500',
                                badge: '법률보호',
                                highlight: true
                            },
                            {
                                icon: BarChart3,
                                title: '인사이트 성과 분석',
                                subtitle: 'Data Insight',
                                description: '단순 노출 수치를 넘어 도달, 반응 등 실제 마케팅 효율(ROI)을 한눈에 확인하세요.',
                                gradient: 'from-purple-500 to-pink-500',
                                borderColor: 'border-purple-200 hover:border-purple-400'
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className={`text-left group bg-white rounded-3xl p-6 lg:p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${feature.borderColor} relative ${feature.highlight ? 'ring-2 ring-blue-300' : ''}`}
                            >
                                {/* 뱃지 (법적 보호에만) */}
                                {feature.badge && (
                                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                                        {feature.badge}
                                    </div>
                                )}

                                {/* 아이콘 */}
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>

                                {/* 타이틀 */}
                                <h3 className="text-xl font-bold mb-2 text-primary group-hover:text-primary-dark transition-colors">
                                    {feature.title}
                                </h3>

                                {/* 서브타이틀 (영문) */}
                                <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wide">
                                    {feature.subtitle}
                                </p>

                                {/* 설명 */}
                                <p className="text-sm text-text-secondary leading-relaxed break-keep">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Notices & Events */}
            <section className="py-20 bg-gradient-to-b from-white to-rose-50/30">
                <div className="container">
                    <div className="bg-white rounded-2xl border border-border p-10 shadow-sm">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                            <h2 className="text-2xl font-black">이벤트 & 공지 <span className="text-primary">📢</span></h2>
                            <Link href="/community/notice" className="text-sm font-bold text-gray-400 hover:text-primary transition-colors">전체보기</Link>
                        </div>
                        {notices.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                등록된 공지사항이 없습니다.
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {notices.map(notice => (
                                    <Link key={notice.id} href={`/community/notice/${notice.id}`}>
                                        <li className="flex items-center gap-4 py-4 px-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <div className={`px-3 py-1 text-xs rounded-lg font-bold ${notice.type === '이벤트' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{notice.type}</div>
                                            <div className="flex-1 text-base font-bold text-text-main group-hover:text-primary transition-colors">{notice.title}</div>
                                            <div className="text-sm text-slate-400">
                                                {new Date(notice.created_at).toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '')}
                                            </div>
                                        </li>
                                    </Link>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
