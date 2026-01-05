import Link from 'next/link';
import { BookOpen, Briefcase, Sparkles, Crown } from 'lucide-react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export default async function StaticPromoBanners() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    let isAdvertiser = false;

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'ADVERTISER') {
            isAdvertiser = true;
        }
    }

    const advertiserBanner = {
        id: 2,
        title: '광고주 전용',
        subtitle: '왜 내 브랜드만 안 보일까?',
        description: '검색 결과 1면을 장악하는 다온뷰만의 노출 전략',
        bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
        icon: Briefcase,
        link: '/intro',
        accentColor: 'text-rose-100',
        cta: '서비스 소개서 보기',
        isSpecial: true
    };

    const influencerBanner = {
        id: 2, // Keep same ID for layout consistency if needed, or unique
        title: '등급별 혜택',
        subtitle: '레벨업하고 더 큰 보상받기',
        description: '인플루언서만을 위한 특별한 혜택을 확인하세요',
        bgColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
        icon: Crown,
        link: '/guide',
        accentColor: 'text-violet-100',
        cta: '혜택 확인하기',
        isSpecial: true
    };

    const banners = [
        {
            id: 1,
            title: '꿀팁 X파일!',
            subtitle: '캠페인 신청 노하우',
            description: '합격률 UP! 비법 대공개',
            bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
            icon: BookOpen,
            link: '/guide',
            accentColor: 'text-blue-100',
            cta: '자세히 보기',
            isSpecial: false
        },
        // Conditionally swap the second banner
        isAdvertiser ? advertiserBanner : influencerBanner,
        {
            id: 3,
            title: '새로 나온',
            subtitle: '신규 캠페인',
            description: '따끈따끈한 새 캠페인을 만나보세요!',
            bgColor: 'bg-gradient-to-br from-orange-400 to-orange-500',
            icon: Sparkles,
            link: '/campaigns?sort=new',
            accentColor: 'text-orange-100',
            cta: '자세히 보기',
            isSpecial: false
        }
    ];

    return (
        <section className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {banners.map((banner) => {
                    const IconComponent = banner.icon;
                    // Using banner.isSpecial flag instead of hardcoded ID check
                    const isSpecial = banner.isSpecial;

                    return (
                        <Link
                            key={banner.id}
                            href={banner.link}
                            className={`${banner.bgColor} rounded-2xl p-8 relative overflow-hidden group transition-all duration-300 cursor-pointer ${isSpecial
                                    ? 'shadow-xl shadow-rose-200 ring-4 ring-rose-400/30 scale-[1.02] hover:scale-[1.07] hover:shadow-2xl'
                                    : 'hover:shadow-2xl hover:scale-105'
                                }`}
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
                                        {banner.cta}
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
