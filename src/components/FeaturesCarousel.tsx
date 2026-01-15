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
    glowColor: string;
    iconColor: string;
    borderColor: string;
    badge?: string;
    highlight?: boolean;
}

const features: Feature[] = [
    {
        icon: Sparkles,
        title: 'AI 자동 원고 생성',
        subtitle: 'Efficiency',
        description: '"사진만 보내주세요." 상황과 문맥을 분석해 AI가 3분 만에 최적화된 포스팅 원고를 대신 써드립니다.',
        gradient: 'from-blue-500/20 to-indigo-500/20',
        glowColor: 'group-hover:shadow-blue-500/10',
        iconColor: 'text-blue-500',
        borderColor: 'border-slate-100 group-hover:border-blue-200'
    },
    {
        icon: Gem,
        title: '황금 키워드 발굴',
        subtitle: 'Strategy',
        description: '아무리 써도 노출이 안 되나요? 경쟁은 적고 검색량은 폭발적인 \'황금 키워드\'를 쏙쏙 골라 떠먹여 드립니다.',
        gradient: 'from-amber-400/20 to-orange-500/20',
        glowColor: 'group-hover:shadow-amber-500/20',
        iconColor: 'text-amber-500',
        borderColor: 'border-slate-100 group-hover:border-orange-200',
        badge: 'NEW',
        highlight: true
    },
    {
        icon: Zap,
        title: '콘텐츠 누락 판별기',
        subtitle: 'Risk Control',
        description: '"내 리뷰가 보이지 않는다면?" 정성껏 만든 콘텐츠가 검색에서 누락되었는지, 1초 만에 상태를 진단해 드립니다.',
        gradient: 'from-rose-500/20 to-red-600/20',
        glowColor: 'group-hover:shadow-rose-500/10',
        iconColor: 'text-rose-500',
        borderColor: 'border-slate-100 group-hover:border-rose-200'
    },
    {
        icon: Activity,
        title: '채널 정밀 진단',
        subtitle: 'Growth',
        description: '내 채널은 상위 몇 %일까요? 지수, 영향력 상태, 성장 가능성까지 한눈에 파악하고 처방전을 받으세요.',
        gradient: 'from-emerald-500/20 to-teal-600/20',
        glowColor: 'group-hover:shadow-emerald-500/10',
        iconColor: 'text-emerald-500',
        borderColor: 'border-slate-100 group-hover:border-emerald-200'
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
                                className={`h-full text-left group bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 lg:p-10 transition-all duration-700 transform hover:-translate-y-5 border-2 ${feature.borderColor} relative overflow-hidden shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] ${feature.glowColor} ${feature.highlight ? 'bg-white/80' : ''}`}
                            >
                                {/* Background Decorative Bloom */}
                                <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${feature.gradient} blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000`} />
                                
                                {/* 뱃지 - 디자인 포인트로 좌측 상단 이동 */}
                                {feature.badge && (
                                    <div className={`absolute top-0 left-10 bg-gradient-to-b ${feature.gradient.replace('/20', '')} text-white text-[9px] px-3 py-1.5 rounded-b-xl font-black tracking-widest shadow-sm z-20`}>
                                        {feature.badge}
                                    </div>
                                )}

                                {/* 아이콘 Bloom 박스 */}
                                <div className="relative mb-10">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 scale-150 rounded-full`} />
                                    <div className={`relative w-14 h-14 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
                                        <feature.icon className={`w-7 h-7 ${feature.iconColor}`} strokeWidth={2.5} />
                                    </div>
                                </div>

                                {/* 타이틀 세트 - 타이포그래피 강화 */}
                                <div className="space-y-2 mb-6 relative z-10">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-600 transition-colors`}>
                                        {feature.subtitle}
                                    </p>
                                    <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tighter group-hover:text-black transition-colors">
                                        {feature.title}
                                    </h3>
                                </div>

                                {/* 설명 - 가독성 향상 */}
                                <p className="text-[14px] text-slate-500 leading-relaxed break-keep group-hover:text-slate-900 transition-colors font-medium opacity-80 group-hover:opacity-100 relative z-10">
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
