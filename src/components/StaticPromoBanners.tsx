'use client';

import Link from 'next/link';
import { BookOpen, Briefcase, Sparkles } from 'lucide-react';

export default function StaticPromoBanners() {
    const banners = [
        {
            id: 1,
            title: '꿀팁 X파일!',
            subtitle: '캠페인 신청 노하우',
            description: '합격률 UP! 비법 대공개',
            cardTone: 'bg-blue-50/85',
            iconTone: 'bg-blue-100/90',
            iconColor: 'text-blue-600',
            textColor: 'text-slate-800',
            descColor: 'text-slate-600',
            icon: BookOpen,
            link: '/guide',
            accentColor: 'text-blue-600',
        },
        {
            id: 2,
            title: '광고주 전용',
            subtitle: '확실한 매출 상승 비결',
            description: '상위 노출부터 브랜딩까지, 결과로 증명하는 솔루션',
            cardTone: 'bg-rose-50/85',
            iconTone: 'bg-rose-100/90',
            iconColor: 'text-rose-600',
            textColor: 'text-slate-800',
            descColor: 'text-slate-600',
            icon: Briefcase,
            link: '/partner/intro',
            accentColor: 'text-rose-600',
        },
        {
            id: 3,
            title: '새로 나온',
            subtitle: '신규 캠페인',
            description: '따끈따끈한 새 캠페인을 만나보세요!',
            cardTone: 'bg-orange-50/85',
            iconTone: 'bg-orange-100/90',
            iconColor: 'text-orange-600',
            textColor: 'text-slate-800',
            descColor: 'text-slate-600',
            icon: Sparkles,
            link: '/campaigns?sort=new',
            accentColor: 'text-orange-600',
        }
    ];

    return (
        <section className="w-full max-w-[1200px] mx-auto px-4 py-4">
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 md:gap-4">
                {banners.map((banner) => {
                    const IconComponent = banner.icon;
                    return (
                        <Link
                            key={banner.id}
                            href={banner.link}
                            className={`${banner.cardTone} rounded-xl md:rounded-2xl p-2.5 md:p-5 relative overflow-hidden group transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-4 hover:-translate-y-0.5 hover:shadow-sm`}
                        >
                            {/* Background Pattern - Subtle */}
                            <div className="absolute inset-0 opacity-[0.03]">
                                <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-black rounded-full -translate-y-6 translate-x-6 md:-translate-y-12 md:translate-x-12"></div>
                            </div>

                            {/* Icon Section */}
                            <div className="shrink-0 relative z-10">
                                <div className={`w-8 h-8 md:w-12 md:h-12 ${banner.iconTone} rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300`}>
                                    <IconComponent className={`w-4 h-4 md:w-6 md:h-6 ${banner.iconColor}`} strokeWidth={2} />
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 min-w-0 relative z-10 text-center md:text-left">
                                <p className={`text-[8px] md:text-[10px] font-bold ${banner.accentColor} mb-0 md:mb-0.5 uppercase tracking-wider opacity-80 line-clamp-1`}>
                                    {banner.title}
                                </p>
                                <h3 className={`text-[10px] sm:text-xs md:text-lg font-bold ${banner.textColor} truncate leading-tight mb-0 md:mb-0.5`}>
                                    {banner.subtitle}
                                </h3>
                                <p className={`hidden md:block ${banner.descColor} text-xs font-medium truncate`}>
                                    {banner.description}
                                </p>
                            </div>

                            {/* Arrow - Hidden on Mobile */}
                            <div className={`hidden md:block shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${banner.textColor}`}>
                                <span className="text-xl">→</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
