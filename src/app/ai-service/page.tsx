'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, LineChart, PenTool, ArrowRight } from "lucide-react";
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
    },
    {
      title: "AI 키워드 글작성 도우미",
      desc: "키워드만 입력하면 AI가 최적화된 글 구조와 내용을 제안합니다. 빠르고 효과적인 포스팅 작성을 경험해보세요.",
      icon: PenTool,
      path: "/ai-service/writing-assistant",
      color: "bg-primary/10 text-primary",
    }
  ];

  return (
    <div className="container py-20 min-h-[80vh]">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-black mb-6 flex items-center justify-center gap-3">
          <Wand2 className="text-primary animate-pulse" size={44} />
          <span className="text-text-main tracking-tight">AI 인텔리전스 센터</span>
        </h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          다온뷰의 독자적인 AI 기술로 당신의 인플루언서 활동을 <br className="hidden md:block" />
          한 단계 더 스마트하게 업그레이드 하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {services.map((service) => (
          <div 
            key={service.path}
            onClick={() => handleServiceClick(service.path)}
            className="group relative cursor-pointer"
          >
            {/* 배경 데코레이션 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            
            <div className="relative bg-white border border-border/50 rounded-3xl p-10 h-full flex flex-col hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
              <div className={`${service.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <service.icon size={36} />
              </div>
              
              <h2 className="text-2xl font-black mb-4 text-text-main group-hover:text-primary transition-colors flex items-center gap-2">
                {service.title}
                <ArrowRight size={20} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h2>
              
              <p className="text-text-secondary text-lg leading-relaxed mb-6 flex-grow">
                {service.desc}
              </p>

              <div className="flex items-center text-sm font-bold text-primary gap-1">
                자세히 보기
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <AuthGuardDialog 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
