import type { Metadata } from 'next';
import React from 'react';
import { PlayCircle, Video, MonitorPlay, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '브랜드 영상제작',
  description: 'CF, 브랜드 필름, 바이럴 영상, 숏폼 콘텐츠 제작을 위한 다온뷰 브랜드 영상제작 서비스입니다.',
  keywords: ['브랜드 영상제작', '브랜드 필름', 'CF 제작', '바이럴 영상', '숏폼 영상 제작', '다온뷰 프로덕션'],
  openGraph: {
    title: '브랜드 영상제작 | 다온뷰',
    description: 'CF, 브랜드 필름, 바이럴 영상, 숏폼 콘텐츠 제작을 위한 다온뷰 브랜드 영상제작 서비스입니다.',
    url: 'https://daonview.com/partner/brand-video',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/partner/brand-video',
  },
};

export default function BrandVideoPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>프리미엄 브랜드 영상 프로덕션</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
             브랜드의 가치를<br className="md:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary">시각화</span>하다
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto font-medium">
            감각적인 연출과 압도적인 퀄리티로, <br className="hidden md:block"/>
            당신의 브랜드 스토리를 가장 매력적인 영상으로 담아냅니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/partner" className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all shadow-[0_0_30px_rgba(255,56,92,0.3)]">
              프로젝트 문의하기
            </Link>
            <button className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur flex items-center gap-2">
               쇼릴 영상 보기 <PlayCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-slate-950">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-violet-500/50 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-6 text-violet-400 group-hover:scale-110 transition-transform">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">CF / 커머셜 영상</h3>
              <p className="text-slate-400 leading-relaxed">
                TV, 유튜브 등 다양한 매체에 최적화된 고퀄리티 광고 영상을 기획 및 제작하여 타겟 오디언스에게 강력한 인상을 남깁니다.
              </p>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-primary/50 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <MonitorPlay className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">브랜드 필름</h3>
              <p className="text-slate-400 leading-relaxed">
                기업의 철학과 비전을 서사적인 스토리텔링으로 풀어내어, 소비자와 깊은 정서적 공감대를 형성하는 브랜드 필름을 제작합니다.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <PlayCircle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">바이럴 콘텐츠</h3>
              <p className="text-slate-400 leading-relaxed">
                SNS 트렌드를 반영한 재치있고 임팩트 있는 바이럴 영상으로 자발적인 확산과 브랜드 인지도 상승을 이끌어냅니다.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Portfolio Mock */}
      <section className="py-24 bg-slate-900">
         <div className="container">
            <div className="flex items-end justify-between mb-12">
                <div>
                   <h2 className="text-4xl font-black mb-4">Featured Work</h2>
                   <p className="text-slate-400">다온뷰 프로덕션의 손끝에서 탄생한 성공적인 프로젝트들</p>
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="group relative aspect-video bg-slate-800 rounded-2xl overflow-hidden cursor-pointer">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white">
                         <PlayCircle className="w-8 h-8" />
                      </div>
                   </div>
                   <div className="absolute bottom-6 left-6">
                      <p className="text-sm font-bold text-violet-400 mb-1">뷰티 브랜드 코스메틱</p>
                      <h3 className="text-2xl font-bold text-white">2024 S/S 캠페인 필름</h3>
                   </div>
                </div>
                
                <div className="group relative aspect-video bg-slate-800 rounded-2xl overflow-hidden cursor-pointer">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555529733-0e67056058e1?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white">
                         <PlayCircle className="w-8 h-8" />
                      </div>
                   </div>
                   <div className="absolute bottom-6 left-6">
                      <p className="text-sm font-bold text-primary mb-1">F&B 프랜차이즈</p>
                      <h3 className="text-2xl font-bold text-white">신메뉴 런칭 커머셜</h3>
                   </div>
                </div>
            </div>
         </div>
      </section>
    </div>
  );
}
