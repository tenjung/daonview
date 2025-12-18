import Link from 'next/link';
import { BookOpen, Briefcase, Sparkles } from 'lucide-react';

export default function StaticPromoBanners() {
    const banners = [
        {
            id: 1,
            title: '꿀팁 X파일!',
            subtitle: '캠페인 신청 노하우',
            description: '합격률 UP! 비법 대공개',
            bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
            icon: BookOpen,
            link: '/guide',
            accentColor: 'text-blue-100'
        },
        {
            id: 2,
            title: '광고주를 위한',
            subtitle: '체험단 진행 가이드',
            description: '광고주님이라면 여기로! 클릭하세요!',
            bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
            icon: Briefcase,
            link: '/intro',
            accentColor: 'text-green-100'
        },
        {
            id: 3,
            title: '새로 나온',
            subtitle: '신규 캠페인',
            description: '따끈따끈한 새 캠페인을 만나보세요!',
            bgColor: 'bg-gradient-to-br from-orange-400 to-orange-500',
            icon: Sparkles,
            link: '/campaigns?sort=new',
            accentColor: 'text-orange-100'
        }
    ];

    return (
        <section className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {banners.map((banner) => {
                    const IconComponent = banner.icon;
                    return (
                        <Link 
                            key={banner.id}
                            href={banner.link}
                            className={`${banner.bgColor} rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer`}
                        >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className={`text-sm font-bold ${banner.accentColor} mb-1`}>{banner.title}</p>
                                        <h3 className="text-2xl font-black text-white leading-tight mb-2">
                                            {banner.subtitle}
                                        </h3>
                                        <p className="text-white/90 text-sm font-medium">
                                            {banner.description}
                                        </p>
                                    </div>
                                    <div className="shrink-0 ml-4">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                            <IconComponent className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="mt-6 pt-4 border-t border-white/20">
                                    <span className="inline-flex items-center gap-2 text-white font-bold text-sm group-hover:gap-3 transition-all">
                                        자세히 보기 
                                        <span className="text-lg">→</span>
                                    </span>
                                </div>
                            </div>

                            {/* Decorative Character Placeholder */}
                            <div className="absolute bottom-4 right-4 w-20 h-20 opacity-30 group-hover:opacity-50 transition-opacity">
                                <div className="w-full h-full bg-white/20 rounded-full"></div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
