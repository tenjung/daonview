'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, LineChart, PenTool, ArrowRight, Sparkles, Tags } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AuthGuardDialog } from "@/components/auth/AuthGuardDialog";
import { normalizeRoleValue } from "@/lib/campaignPermissions";

export default function AIServicePageClient() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const normalizedRole = normalizeRoleValue(profile?.role);

  const handleServiceClick = (path: string, isComingSoon?: boolean) => {
    if (isComingSoon) {
      return;
    }

    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      router.push(path);
    }
  };

  const services = [
    {
      title: "내 포스팅 분석",
      desc: "작성한 포스팅의 품질과 성과를 AI가 정밀하게 분석해드립니다. 누락 여부, 키워드 적합성, 이미지 품질 등을 확인해보세요.",
      mobileDesc: "포스팅 품질, 누락, 키워드/이미지 적합성을 AI가 빠르게 분석합니다.",
      icon: LineChart,
      path: "/ai-service/analysis",
      color: "bg-blue-500/10 text-blue-600",
      gradient: "from-blue-500/20 to-cyan-400/20",
      isComingSoon: false,
    },
    {
      title: "AI 키워드 글작성 도우미",
      desc: "키워드만 입력하면 AI가 최적화된 글 구조와 내용을 제안합니다. 빠르고 효과적인 포스팅 작성을 경험해보세요.",
      mobileDesc: "키워드 입력만으로 AI가 글 구조와 핵심 문장을 제안합니다.",
      icon: PenTool,
      path: "/ai-service/writing-assistant",
      color: "bg-primary/10 text-primary",
      gradient: "from-primary/20 to-purple-500/20",
      isComingSoon: false,
    },
    {
      title: "1분 랜딩페이지 생성기",
      desc: "인플루언서 포트폴리오나 사업 아이템을 입력하면 AI가 즉시 배포 가능한 전문적인 웹페이지를 생성합니다.",
      mobileDesc: "포트폴리오/사업 정보를 입력하면 랜딩페이지를 빠르게 생성합니다.",
      icon: Wand2,
      path: "/ai-service/landing-builder",
      color: "bg-purple-500/10 text-purple-600",
      gradient: "from-purple-500/20 to-pink-500/20",
      isComingSoon: false,
    },
    {
      title: "영상 제작 도우미",
      desc: "원고와 이미지, 영상 파편을 기반으로 AI가 음성·자막·세로 쇼츠 생성 파이프라인을 실행합니다.",
      mobileDesc: "대본만으로도 음성·자막·세로 쇼츠를 빠르게 생성합니다.",
      icon: Wand2,
      path: "/ai-service/video-assistant",
      color: "bg-emerald-500/10 text-emerald-600",
      gradient: "from-emerald-500/20 to-teal-500/20",
      isComingSoon: false,
    },
    {
      title: "스마트스토어 태그 분석기",
      desc: "상품 키워드와 카테고리를 기준으로 태그 후보, 검색량, 조합 확장 가능성을 분석합니다.",
      mobileDesc: "키워드와 카테고리 기준으로 스마트스토어 태그 후보를 분석합니다.",
      icon: Tags,
      path: "/ai-service/smart-store-tags",
      color: "bg-amber-500/10 text-amber-600",
      gradient: "from-amber-500/20 to-emerald-500/20",
      isComingSoon: false,
      hiddenForRoles: ["INFLUENCER"],
    }
  ].filter((service) => !service.hiddenForRoles?.includes(normalizedRole));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-400/10 blur-[100px] animate-bounce-slow" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[120px] animate-pulse" />
      </div>

      <div className="container relative z-10 pt-12 md:pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-primary/10 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="text-primary" size={16} />
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Powered by DAON AI Engine
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
            <span className="inline-block bg-gradient-to-r from-text-main via-primary to-[#d946ef] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent pb-2">
              AI 인텔리전스 센터
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary/80 leading-relaxed font-medium animate-in fade-in duration-1000 delay-300 mb-8">
            다온뷰의 독자적인 AI 기술로 당신의 인플루언서 활동을 <br className="hidden md:block" />
            <span className="text-text-main font-bold">한 단계 더 스마트하게</span> 업그레이드 하세요.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100/50 animate-in fade-in duration-1000 delay-500">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-medium text-indigo-700">모든 AI 서비스는 <strong>매일 자정(KST 00:00)</strong> 기준 이용 횟수가 재충전됩니다.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5 max-w-6xl mx-auto px-3 sm:px-4">
          {services.map((service) => (
            <div
              key={service.path}
              onClick={() => handleServiceClick(service.path, service.isComingSoon)}
              className={`group relative rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 overflow-hidden ${
                service.isComingSoon
                  ? "cursor-not-allowed opacity-90"
                  : "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(235,2,112,0.08)]"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${service.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`} />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className={`${service.color} w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-inner shrink-0`}>
                  <service.icon size={26} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-2">
                    <h2 className="text-lg md:text-2xl leading-tight font-black text-text-main tracking-tight">
                      {service.title}
                    </h2>
                    {service.isComingSoon && (
                      <span className="w-fit text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        (개발중)
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-text-secondary/75 leading-relaxed font-medium">
                    <span className="md:hidden">{service.mobileDesc ?? service.desc}</span>
                    <span className="hidden md:inline">{service.desc}</span>
                  </p>
                </div>

                <div className="w-full sm:w-auto sm:ml-2">
                  <div className={`inline-flex w-full justify-center sm:w-auto items-center whitespace-nowrap text-sm md:text-base font-bold px-4 md:px-5 py-2.5 rounded-full transition-all duration-300 ${
                    service.isComingSoon
                      ? "text-slate-500 bg-slate-100 border border-slate-200"
                      : "text-primary bg-primary/5 group-hover:bg-primary group-hover:text-white"
                  }`}>
                    {service.isComingSoon ? "개발중" : "시작하기"}
                    {!service.isComingSoon && <ArrowRight size={16} className="ml-1.5" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 10s ease-in-out infinite;
        }
      `}</style>

      <AuthGuardDialog
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
