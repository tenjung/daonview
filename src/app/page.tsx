import Link from 'next/link';
import CampaignCard from '@/components/CampaignCard';
import VisualCampaignSlider from '@/components/VisualCampaignSlider';
import { supabase } from '@/lib/supabaseClient';
import { mapCampaignToCard } from '@/lib/campaignUtils';

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
  const { data: latestData } = await supabase
    .from('campaigns')
    .select('*, applications(count)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(4);
  const latestCampaigns = latestData?.map(c => mapCampaignToCard(c as any)) || [];

  const { data: popularData } = await supabase
    .from('campaigns')
    .select('*, applications(count)')
    .eq('status', 'approved')
    .order('recruit_count', { ascending: false })
    .limit(4);
  const popularCampaigns = popularData?.map(c => mapCampaignToCard(c as any)) || [];

  const { data: deliveryData } = await supabase
    .from('campaigns')
    .select('*, applications(count)')
    .eq('type', 'DELIVERY')
    .eq('status', 'approved')
    .limit(4);
  const deliveryCampaigns = deliveryData?.map(c => mapCampaignToCard(c as any)) || [];

  const { data: visitData } = await supabase
    .from('campaigns')
    .select('*, applications(count)')
    .eq('type', 'VISIT')
    .eq('status', 'approved')
    .limit(4);
  const visitCampaigns = visitData?.map(c => mapCampaignToCard(c as any)) || [];

  const notices = [
    { id: 1, type: "공지", title: "다온뷰 서비스 리뉴얼 오픈 안내", date: "2024.12.01" },
    { id: 2, type: "이벤트", title: "신규 회원가입 시 5,000 포인트 즉시 지급!", date: "2024.12.05" },
    { id: 3, type: "공지", title: "인스타그램 릴스 체험단 가이드", date: "2024.11.20" },
  ];

  return (
    <div className="bg-background">
      {/* Hero / Latest Campaigns */}
      <section className="bg-gradient-to-br from-rose-50 to-white py-16 border-b border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <span className="inline-block bg-pink-100 text-primary px-3 py-1 rounded-full text-sm font-bold mb-4">NEW ARRIVALS</span>
              <h1 className="text-5xl font-extrabold text-text-main mb-6 tracking-tight leading-tight">
                지금 가장 <span className="text-primary relative z-10 after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-full after:h-4 after:bg-pink-200 after:-z-10 after:opacity-50">핫한 체험</span>을<br />
                만나보세요
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed mb-8">
                매일 업데이트되는 새로운 미션, 당신의 일상을 특별하게.<br />
                지금 바로 신청하고 크리에이터가 되어보세요!
              </p>
              <div className="flex gap-4">
                <Link href="/campaigns" className="btn btn-primary">캠페인 전체보기</Link>
                <Link href="/guide" className="btn btn-outline">이용 가이드</Link>
              </div>
            </div>

            <div className="flex-1 min-w-[320px] max-w-[400px]">
              <div className="flex justify-between items-center mb-4 font-bold text-text-main px-2">
                <h3 className="text-xl">따끈따끈 신규 캠페인 🔥</h3>
                <Link href="/campaigns?sort=new" className="text-sm text-text-secondary hover:text-primary transition-colors">더보기 &gt;</Link>
              </div>
              <VisualCampaignSlider campaigns={latestCampaigns} />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns */}
      <section className="container py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-text-main flex items-center gap-2">
            <span className="text-3xl">🏆</span> 인기 폭발! 베스트 체험단
          </h2>
          <Link href="/campaigns?sort=popular" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">전체보기</Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {popularCampaigns.map(cam => (
            <CampaignCard
              key={cam.id}
              id={cam.id}
              title={cam.title}
              platform={cam.platform}
              type={cam.type}
              applicants={cam.applicants}
              total={cam.total}
              dday={cam.dday}
              imageUrl={cam.imageUrl}
              provision={cam.provision}
              region={cam.region}
            />
          ))}
          {/* Skeleton Fillers */}
          {[...Array(Math.max(0, 4 - popularCampaigns.length))].map((_, i) => (
            <CampaignSkeleton key={`skel-pop-${i}`} />
          ))}
        </div>
      </section>

      {/* Delivery Campaigns */}
      <section className="container py-12 border-t border-dashed border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-text-main flex items-center gap-2">
            <span className="text-3xl">📦</span> 집으로 숑~ 배송형 체험단
          </h2>
          <Link href="/campaigns?type=delivery" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">전체보기</Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {deliveryCampaigns.map(cam => (
            <CampaignCard
              key={cam.id}
              id={cam.id}
              title={cam.title}
              platform={cam.platform}
              type={cam.type}
              applicants={cam.applicants}
              total={cam.total}
              dday={cam.dday}
              imageUrl={cam.imageUrl}
              provision={cam.provision}
              region={cam.region}
            />
          ))}
          {[...Array(Math.max(0, 4 - deliveryCampaigns.length))].map((_, i) => (
            <CampaignSkeleton key={`skel-del-${i}`} />
          ))}
        </div>
      </section>

      {/* Visit Campaigns */}
      <section className="container py-12 border-t border-dashed border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-text-main flex items-center gap-2">
            <span className="text-3xl">🏃</span> 직접 가보자! 방문형 체험단
          </h2>
          <Link href="/campaigns?type=visit" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">전체보기</Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {visitCampaigns.map(cam => (
            <CampaignCard
              key={cam.id}
              id={cam.id}
              title={cam.title}
              platform={cam.platform}
              type={cam.type}
              applicants={cam.applicants}
              total={cam.total}
              dday={cam.dday}
              imageUrl={cam.imageUrl}
              provision={cam.provision}
              region={cam.region}
            />
          ))}
          {[...Array(Math.max(0, 4 - visitCampaigns.length))].map((_, i) => (
            <CampaignSkeleton key={`skel-vis-${i}`} />
          ))}
        </div>
      </section>

      {/* Service Introduction */}
      <section className="bg-white py-20 text-center border-y border-border mt-8">
        <div className="container">
          <h2 className="text-2xl font-extrabold text-text-main mb-12">DAONVIEW는 무엇이 다른가요?</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mb-4 text-rose-500 shadow-sm">🛍️</div>
              <h3 className="text-lg font-bold mb-2 text-primary-dark">다양한 캠페인</h3>
              <p className="text-sm text-text-secondary leading-relaxed">맛집부터 뷰티, IT기기까지<br />매일 새로운 체험이 가득!</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mb-4 text-rose-500 shadow-sm">⚡</div>
              <h3 className="text-lg font-bold mb-2 text-primary-dark">빠른 선정</h3>
              <p className="text-sm text-text-secondary leading-relaxed">기다림은 그만!<br />신속한 매칭 시스템</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mb-4 text-rose-500 shadow-sm">💰</div>
              <h3 className="text-lg font-bold mb-2 text-primary-dark">포인트 혜택</h3>
              <p className="text-sm text-text-secondary leading-relaxed">체험도 하고 포인트도 쌓고<br />현금처럼 환급까지</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mb-4 text-rose-500 shadow-sm">📊</div>
              <h3 className="text-lg font-bold mb-2 text-primary-dark">성과 리포트</h3>
              <p className="text-sm text-text-secondary leading-relaxed">나의 영향력을 한눈에<br />확인하는 데이터 제공</p>
            </div>
          </div>
        </div>
      </section>

      {/* Notices & Events */}
      <section className="container py-16">
        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="flex justify-between items-center mb-6 border-b-2 border-text-main pb-4">
            <h2 className="text-xl font-bold">이벤트 & 공지 📢</h2>
            <Link href="/notice" className="text-sm text-text-secondary hover:text-primary">전체보기</Link>
          </div>
          <ul className="list-none">
            {notices.map(notice => (
              <li key={notice.id} className="flex items-center py-3 border-b border-slate-100 last:border-none cursor-pointer hover:bg-slate-50 transition-colors px-2 rounded">
                <div className={`px-2 py-1 text-xs rounded font-semibold mr-4 min-w-[50px] text-center ${notice.type === '이벤트' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>{notice.type}</div>
                <div className="flex-1 text-sm md:text-base text-text-main">{notice.title}</div>
                <div className="text-xs md:text-sm text-slate-400">{notice.date}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
