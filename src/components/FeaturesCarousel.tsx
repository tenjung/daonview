'use client';

import Link from 'next/link';
import { 
    Carousel, 
    CarouselContent, 
    CarouselItem 
} from "@/components/ui/carousel";
import { FilePenLine, Search, ShieldCheck, Clapperboard, LucideIcon } from 'lucide-react';

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
        icon: FilePenLine,
        title: 'AI 자동 원고 생성',
        subtitle: 'Efficiency',
        description: '"사진만 보내주세요." 상황과 문맥을 분석해 AI가 3분 만에 최적화된 포스팅 원고를 대신 써드립니다.',
        gradient: 'from-blue-500/20 to-indigo-500/20',
        glowColor: 'group-hover:shadow-blue-500/10',
        iconColor: 'text-blue-500',
        borderColor: 'border-slate-100 group-hover:border-blue-200'
    },
    {
        icon: Search,
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
        icon: ShieldCheck,
        title: 'AI 게시물 진단 매니저',
        subtitle: '콘텐츠 모니터링 도구',
        description: 'AI를 통한 기술적 참고치를 기반으로 수정방안을 마련합니다.',
        gradient: 'from-rose-500/20 to-red-600/20',
        glowColor: 'group-hover:shadow-rose-500/10',
        iconColor: 'text-rose-500',
        borderColor: 'border-slate-100 group-hover:border-rose-200'
    },
    {
        icon: Clapperboard,
        title: '영상 제작 도우미',
        subtitle: 'Production',
        description: '원고 / 이미지 기반으로 영상 생성까지 한 번에 연결해 제작 시간을 크게 줄여드립니다.',
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
                <CarouselContent className="-ml-4 py-10">
                    {features.map((feature, idx) => (
                        <CarouselItem 
                            key={idx} 
                            className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 grow-0 shrink-0 py-4"
                        >
                            <Link href="/ai-service" className="block h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[3rem]">
                                <div
                                    className={`h-full min-h-[240px] md:min-h-[260px] flex flex-col justify-start text-left group bg-white/70 backdrop-blur-xl rounded-[3rem] px-8 py-6 lg:px-10 lg:py-8 transition-all duration-700 transform hover:-translate-y-5 border-2 ${feature.borderColor} relative overflow-hidden shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] ${feature.glowColor} ${feature.highlight ? 'bg-white/80' : ''}`}
                                >
                                    {/* Background Decorative Bloom */}
                                    <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${feature.gradient} blur-[60px] opacity-20 group-hover:opacity-50 transition-opacity duration-1000 z-0`} />
                                    
                                    {/* 🌟 워터마크 배경 아이콘 (우측 하단) - 크기 및 투명도 밸런스 조정 */}
                                    <div className={`absolute -bottom-4 -right-4 z-0 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-1000 transform group-hover:-rotate-12 group-hover:scale-110 pointer-events-none`}>
                                        <feature.icon className={`w-40 h-40 lg:w-48 lg:h-48 ${feature.iconColor}`} strokeWidth={1.5} />
                                    </div>

                                    {/* 뱃지 - 디자인 포인트로 좌측 상단 이동 */}
                                    {feature.badge && (
                                        <div className={`absolute top-0 left-10 bg-gradient-to-b ${feature.gradient.replace('/20', '')} text-white text-[9px] px-3 py-1.5 rounded-b-xl font-black tracking-widest shadow-sm z-20`}>
                                            {feature.badge}
                                        </div>
                                    )}

                                    {/* 콘텐츠 영역 (최상위 Layer) */}
                                    <div className={`relative z-10 flex flex-col h-full ${feature.badge ? 'pt-4' : ''}`}>
                                        {/* 타이틀 세트 - 타이포그래피 강화 */}
                                        <div className="space-y-2 mb-4">
                                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-600 transition-colors`}>
                                                {feature.subtitle}
                                            </p>
                                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight tracking-tighter group-hover:text-black transition-colors break-keep">
                                                {feature.title}
                                            </h3>
                                        </div>

                                        {/* 설명 - 가독성 향상 */}
                                        <p className="text-[13px] sm:text-[14px] text-slate-500 leading-relaxed break-keep font-medium opacity-80 group-hover:opacity-100 transition-opacity mt-2 max-w-[90%] lg:max-w-[85%]">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
