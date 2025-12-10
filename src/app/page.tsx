import Link from 'next/link';
import CampaignCard from '@/components/CampaignCard';

export default function Home() {
  const latestCampaigns = [
    { id: 101, title: "프리미엄 비건 화장품 3종 세트", platform: "INSTAGRAM", type: "DELIVERY", applicants: 12, total: 30, dday: "D-5", category: "뷰티" },
    { id: 102, title: "강남 5성급 호텔 디너 뷔페 2인", platform: "BLOG", type: "VISIT", applicants: 45, total: 5, dday: "D-1", category: "맛집" },
    { id: 103, title: "힙한 성수동 팝업스토어 방문", platform: "REELS", type: "VISIT", applicants: 22, total: 10, dday: "D-3", category: "핫플" },
    { id: 104, title: "가정용 미니 제습기", platform: "YOUTUBE", type: "DELIVERY", applicants: 8, total: 3, dday: "D-7", category: "생활" },
  ];

  const popularCampaigns = [
    { id: 201, title: "줄서는 맛집, 치즈 폭탄 피자", platform: "BLOG", type: "VISIT", applicants: 156, total: 10, dday: "D-2", category: "맛집" },
    { id: 202, title: "다이어트 곤약 젤리 1box", platform: "INSTAGRAM", type: "DELIVERY", applicants: 89, total: 50, dday: "D-4", category: "푸드" },
    { id: 203, title: "틱톡 댄스 챌린지 (음원 제공)", platform: "TIKTOK", type: "DELIVERY", applicants: 40, total: 20, dday: "D-10", category: "기타" },
    { id: 204, title: "해운대 오션뷰 카페", platform: "BLOG", type: "VISIT", applicants: 200, total: 5, dday: "D-1", category: "맛집" },
  ];

  const deliveryCampaigns = [
    { id: 301, title: "촉촉한 수분 광채 세럼 리뷰", platform: "INSTAGRAM", type: "DELIVERY", applicants: 45, total: 50, dday: "D-1", category: "뷰티" },
    { id: 302, title: "가정용 미니 제습기 체험단", platform: "YOUTUBE", type: "DELIVERY", applicants: 8, total: 3, dday: "D-7", category: "생활" },
    { id: 303, title: "데일리 비타민 C 1개월분", platform: "INSTAGRAM", type: "DELIVERY", applicants: 30, total: 30, dday: "D-4", category: "푸드" },
    { id: 304, title: "무선 노이즈캔슬링 헤드폰", platform: "YOUTUBE", type: "DELIVERY", applicants: 120, total: 5, dday: "D-3", category: "IT" },
  ];

  const visitCampaigns = [
    { id: 401, title: "프리미엄 오마카세 2인 식사권", platform: "BLOG", type: "VISIT", applicants: 15, total: 20, dday: "D-3", category: "맛집" },
    { id: 402, title: "성수 힙한 감성 카페 디저트 세트", platform: "REELS", type: "VISIT", applicants: 22, total: 5, dday: "D-5", category: "맛집" },
    { id: 403, title: "해운대 오션뷰 호텔 1박", platform: "BLOG", type: "VISIT", applicants: 200, total: 2, dday: "D-0", category: "여행" },
    { id: 404, title: "홍대 줄서는 라멘집 식사권", platform: "SHORTS", type: "VISIT", applicants: 50, total: 10, dday: "D-2", category: "맛집" },
  ];

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

            <div className="flex-1 min-w-[320px] bg-white rounded-2xl shadow-xl shadow-primary/10 p-6 border border-border">
              <div className="flex justify-between items-center mb-4 font-bold text-text-main">
                <h3>따끈따끈 신규 캠페인 🔥</h3>
                <Link href="/campaigns?sort=new" className="text-sm text-text-secondary">더보기 &gt;</Link>
              </div>
              <div className="flex flex-col gap-4">
                {latestCampaigns.map(cam => (
                  <div key={cam.id} className="flex gap-4 pb-4 border-b border-slate-100 last:border-none last:pb-0">
                    <div className="w-[70px] h-[70px] bg-rose-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex gap-2 mb-1 text-xs items-center">
                        <span className="font-bold text-primary">{cam.platform}</span>
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{cam.type === 'VISIT' ? '방문' : '배송'}</span>
                      </div>
                      <div className="font-semibold text-sm mb-1 text-text-main line-clamp-1">
                        {cam.title}
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>{cam.dday}</span>
                        <span>{cam.applicants}명 신청중</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
            />
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
            />
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
            />
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
