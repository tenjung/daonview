'use client';

import { 
    Carousel, 
    CarouselContent, 
    CarouselItem 
} from "@/components/ui/carousel";
import { Sparkles, Gem, Zap, Activity, LucideIcon } from 'lucide-react';

interface Feature {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    description: string;
    gradient: string;
    borderColor: string;
    badge?: string;
    highlight?: boolean;
}

const features: Feature[] = [
    {
        icon: Sparkles,
        title: 'AI 자동 원고 생성',
        subtitle: '생산성',
        description: '"사진만 보내주세요." 상황과 문맥을 분석해 AI가 3분 만에 최적화된 포스팅 원고를 대신 써드립니다.',
        gradient: 'from-indigo-500 to-blue-600',
        borderColor: 'border-indigo-100 hover:border-indigo-500'
    },
    {
        icon: Gem,
        title: '황금 키워드 발굴',
        subtitle: '노출 전략',
        description: '아무리 써도 노출이 안 되나요? 경쟁은 적고 검색량은 폭발적인 \'황금 키워드\'를 쏙쏙 골라 떠먹여 드립니다.',
        gradient: 'from-orange-400 to-amber-600',
        borderColor: 'border-orange-100 hover:border-orange-500',
        badge: 'NEW',
        highlight: true
    },
    {
        icon: Zap,
        title: '콘텐츠 누락 판별기',
        subtitle: '위험 관리',
        description: '"내 리뷰가 보이지 않는다면?" 정성껏 만든 콘텐츠가 검색에서 누락되었는지, 1초 만에 상태를 진단해 드립니다.',
        gradient: 'from-rose-500 to-red-600',
        borderColor: 'border-rose-100 hover:border-rose-500'
    },
    {
        icon: Activity,
        title: '채널 정밀 진단',
        subtitle: '성장 진단',
        description: '내 채널은 상위 몇 %일까요? 지수, 영향력 상태, 성장 가능성까지 한눈에 파악하고 처방전을 받으세요.',
        gradient: 'from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-100 hover:border-emerald-500'
    }
];

export default function FeaturesCarousel() {
    return (
        <div className="w-full max-w-[1240px] mx-auto overflow-visible px-4 md:px-5">
            <Carousel
                opts={{
                    align: "start",
                    loop: false,
                }}
                className="w-full overflow-visible"
            >
                <CarouselContent className="-ml-4 md:ml-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 py-10">
                    {features.map((feature, idx) => (
                        <CarouselItem 
                            key={idx} 
                            className="pl-4 basis-[85%] sm:basis-1/2 md:basis-auto grow-0 shrink-0 md:grow md:shrink py-4"
                        >
                            <div
                                className={`h-full text-left group bg-white rounded-[2.5rem] p-6 lg:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border-2 ${feature.borderColor} relative ${feature.highlight ? 'ring-4 ring-orange-100/50' : ''}`}
                            >
                                {/* 뱃지 - 색상 싱크 맞춤 */}
                                {feature.badge && (
                                    <div className={`absolute -top-4 -right-2 bg-gradient-to-r ${feature.gradient} text-white text-[10px] px-3.5 py-1.5 rounded-full font-black shadow-lg shadow-orange-200 animate-bounce z-20`}>
                                        {feature.badge}
                                    </div>
                                )}

                                {/* 아이콘 박스 */}
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform duration-500 shadow-lg shadow-gray-200`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>

                                {/* 타이틀 세트 */}
                                <div className="space-y-2 mb-6">
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity`}>
                                        {feature.subtitle}
                                    </p>
                                    <h3 className="text-xl font-black text-slate-800 leading-tight">
                                        {feature.title}
                                    </h3>
                                </div>

                                {/* 설명 */}
                                <p className="text-sm text-slate-500 leading-relaxed break-keep group-hover:text-slate-700 transition-colors">
                                    {feature.description}
                                </p>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
