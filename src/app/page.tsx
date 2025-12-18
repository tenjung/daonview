import Link from 'next/link';
import CampaignCard from '@/components/CampaignCard';
import InteractiveRollingBanner from '@/components/InteractiveRollingBanner';
import StaticPromoBanners from '@/components/StaticPromoBanners';
import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';
import { Package } from 'lucide-react';

// Skeleton Component for empty slots
const CampaignSkeleton = () => (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white h-full shadow-sm">
        <div className="aspect-[4/3] bg-gray-100 animate-pulse relative">
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                <span className="text-4xl opacity-20">Coming Soon</span>
            </div>
        </div>
        <div className="p-5 space-y-3">
            <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-12 h-6 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="w-3/4 h-5 bg-gray-100 rounded animate-pulse" />
            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
                <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
                <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
        </div>
    </div>
);

export default async function Home() {
    // 1. Latest Campaigns (Limited to 4)
    const { data: latestData } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .in('status', ['RECRUITING', 'ONGOING'])
        .order('created_at', { ascending: false })
        .limit(4);
    const latestCampaigns = latestData?.map(c => mapCampaignToCard(c as any)) || [];

    // 3. Popular Campaigns (Sorted by application count, top 4)
    const { data: popularRawData } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .in('status', ['RECRUITING', 'ONGOING'])
        .limit(20);

    const popularCampaigns = (popularRawData || [])
        .map(c => mapCampaignToCard(c as any))
        .sort((a, b) => (b.applicants || 0) - (a.applicants || 0))
        .slice(0, 4);

    // 4. Delivery & Visit (Remain at 4)
    const { data: deliveryData } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .in('type', ['배송형', 'DELIVERY'])
        .in('status', ['RECRUITING', 'ONGOING'])
        .limit(4);
    const deliveryCampaigns = deliveryData?.map(c => mapCampaignToCard(c as any)) || [];

    const { data: visitData } = await supabase
        .from('campaigns')
        .select('*, applications(count)')
        .in('type', ['방문형', 'VISIT'])
        .in('status', ['RECRUITING', 'ONGOING'])
        .limit(4);
    const visitCampaigns = visitData?.map(c => mapCampaignToCard(c as any)) || [];

    // Fetch latest notices from database
    const { data: noticesData } = await supabase
        .from('notices')
        .select('id, type, title, created_at')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

    const notices = noticesData || [];

    return (
        <div className="bg-background">
            {/* NEW Interactive Rolling Banner System */}
            <InteractiveRollingBanner />

            {/* Static Promotional Banners */}
            <StaticPromoBanners />

            {/* New Campaigns Section (4 items) */}
            <section className="container py-16">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <span className="inline-block bg-pink-100 text-primary px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider">NEW ARRIVALS</span>
                        <h2 className="text-3xl font-black text-text-main flex items-center gap-2">
                            따끈따끈 신규 캠페인 <span className="text-primary">🔥</span>
                        </h2>
                    </div>
                    <Link href="/campaigns?sort=new" className="text-sm font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1 group">
                        전체보기 <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {latestCampaigns.map(cam => (
                        <CampaignCard key={cam.id} {...cam} />
                    ))}
                    {[...Array(Math.max(0, 4 - latestCampaigns.length))].map((_, i) => (
                        <CampaignSkeleton key={`skel-new-${i}`} />
                    ))}
                </div>
            </section>

            {/* Popular Campaigns Section (4 items) */}
            <section className="bg-slate-50 border-y border-gray-100">
                <div className="container py-16">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider">HOT & POPULAR</span>
                            <h2 className="text-3xl font-black text-text-main flex items-center gap-2">
                                인기 폭발! 베스트 체험단 <span className="text-amber-400">🏆</span>
                            </h2>
                        </div>
                        <Link href="/campaigns?sort=popular" className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 group">
                            전체보기 <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {popularCampaigns.map(cam => (
                            <CampaignCard key={cam.id} {...cam} />
                        ))}
                        {[...Array(Math.max(0, 4 - popularCampaigns.length))].map((_, i) => (
                            <CampaignSkeleton key={`skel-pop-${i}`} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Delivery Campaigns */}
            <section className="container py-16">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <span className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider">DELIVERY</span>
                        <h2 className="text-3xl font-black text-text-main flex items-center gap-2">
                            <Package className="w-8 h-8" /> 편하게 받는 배송형
                        </h2>
                    </div>
                    <Link href="/campaigns?type=delivery" className="text-sm font-bold text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1 group">
                        전체보기 <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {deliveryCampaigns.map(cam => (
                        <CampaignCard key={cam.id} {...cam} />
                    ))}
                    {[...Array(Math.max(0, 4 - deliveryCampaigns.length))].map((_, i) => (
                        <CampaignSkeleton key={`skel-delivery-${i}`} />
                    ))}
                </div>
            </section>

            {/* Visit Campaigns */}
            <section className="bg-slate-50 border-y border-gray-100">
                <div className="container py-16">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="inline-block bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider">VISIT</span>
                            <h2 className="text-3xl font-black text-text-main">직접 체험하는 방문형</h2>
                        </div>
                        <Link href="/campaigns?type=visit" className="text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1 group">
                            전체보기 <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {visitCampaigns.map(cam => (
                            <CampaignCard key={cam.id} {...cam} />
                        ))}
                        {[...Array(Math.max(0, 4 - visitCampaigns.length))].map((_, i) => (
                            <CampaignSkeleton key={`skel-visit-${i}`} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Service Introduction */}
            <section className="bg-white py-24 text-center border-y border-border mt-8">
                <div className="container">
                    <h2 className="text-3xl font-black text-text-main mb-16">DAONVIEW는 무엇이 다른가요?</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                        <div className="flex flex-col items-center group">
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl mb-6 text-rose-500 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">🛍️</div>
                            <h3 className="text-xl font-bold mb-3 text-primary-dark">다양한 캠페인</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">맛집부터 뷰티, IT기기까지<br />매일 새로운 체험이 가득!</p>
                        </div>
                        <div className="flex flex-col items-center group">
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl mb-6 text-rose-500 shadow-sm transition-transform group-hover:scale-110 group-hover:-rotate-6">⚡</div>
                            <h3 className="text-xl font-bold mb-3 text-primary-dark">빠른 선정</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">기다림은 그만!<br />신속한 매칭 시스템</p>
                        </div>
                        <div className="flex flex-col items-center group">
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl mb-6 text-rose-500 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">💰</div>
                            <h3 className="text-xl font-bold mb-3 text-primary-dark">포인트 혜택</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">체험도 하고 포인트도 쌓고<br />현금처럼 환급까지</p>
                        </div>
                        <div className="flex flex-col items-center group">
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl mb-6 text-rose-500 shadow-sm transition-transform group-hover:scale-110 group-hover:-rotate-6">📊</div>
                            <h3 className="text-xl font-bold mb-3 text-primary-dark">성과 리포트</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">나의 영향력을 한눈에<br />확인하는 데이터 제공</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notices & Events */}
            <section className="container py-20">
                <div className="bg-white rounded-3xl border border-border p-10 shadow-sm">
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
                                <li key={notice.id} className="flex items-center gap-4 py-4 px-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <div className={`px-3 py-1 text-xs rounded-full font-bold ${notice.type === '이벤트' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{notice.type}</div>
                                    <div className="flex-1 text-base font-bold text-text-main group-hover:text-primary transition-colors">{notice.title}</div>
                                    <div className="text-sm text-slate-400">
                                        {new Date(notice.created_at).toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
