'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, LineChart, PenTool, ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AuthGuardDialog } from "@/components/auth/AuthGuardDialog";

export default function AIServicePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleServiceClick = (path: string) => {
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
      icon: LineChart,
      path: "/ai-service/analysis",
      color: "bg-blue-500/10 text-blue-600",
      gradient: "from-blue-500/20 to-cyan-400/20",
    },
    {
      title: "AI 키워드 글작성 도우미",
      desc: "키워드만 입력하면 AI가 최적화된 글 구조와 내용을 제안합니다. 빠르고 효과적인 포스팅 작성을 경험해보세요.",
      icon: PenTool,
      path: "/ai-service/writing-assistant",
      color: "bg-primary/10 text-primary",
      gradient: "from-primary/20 to-purple-500/20",
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa]">
      {/* --- 제미나이 스타일 오로라 배경 효과 --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-400/10 blur-[100px] animate-bounce-slow" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[120px] animate-pulse" />
      </div>

      <div className="container relative z-10 pt-12 md:pt-16 pb-24">
        {/* --- 히어로 섹션 --- */}
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
          
          <p className="text-xl md:text-2xl text-text-secondary/80 leading-relaxed font-medium animate-in fade-in duration-1000 delay-300">
            다온뷰의 독자적인 AI 기술로 당신의 인플루언서 활동을 <br className="hidden md:block" />
            <span className="text-text-main font-bold">한 단계 더 스마트하게</span> 업그레이드 하세요.
          </p>
        </div>

        {/* --- 서비스 그리드 --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto px-4">
          {services.map((service, idx) => (
            <div 
              key={service.path}
              onClick={() => handleServiceClick(service.path)}
              className="group relative"
            >
              {/* 카드 호버 시 뒤에서 비치는 빛 효과 */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${service.gradient} rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700`} />
              
              <div className="relative bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2rem] p-10 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(235,2,112,0.1)] hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden border-t-white/60">
                {/* 배경 패턴 살짝 추가 */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                  <service.icon size={120} />
                </div>

                <div className={`${service.color} w-20 h-20 rounded-2xl flex items-center justify-center mb-10 shadow-inner group-hover:rotate-6 transition-all duration-500`}>
                  <service.icon size={40} />
                </div>
                
                <h2 className="text-3xl font-black mb-5 text-text-main tracking-tight group-hover:text-primary transition-colors flex items-center gap-3">
                  {service.title}
                  <ArrowRight size={24} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-primary" />
                </h2>
                
                <p className="text-text-secondary/70 text-lg leading-relaxed mb-10 flex-grow font-medium">
                  {service.desc}
                </p>

                <div className="inline-flex items-center text-base font-bold text-primary group-hover:gap-3 transition-all duration-300 bg-primary/5 self-start px-6 py-3 rounded-full group-hover:bg-primary group-hover:text-white">
                  시작하기
                  <ArrowRight size={18} />
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
