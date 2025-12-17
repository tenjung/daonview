'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Zap, 
    TrendingUp, 
    Shield, 
    BarChart3, 
    Users, 
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Target,
    MessageSquare,
    Award,
    Clock,
    Star,
    Quote,
    Package,
    Smartphone,
    ShoppingBag,
    Coffee,
    Laptop,
    Heart,
    Infinity,
    Puzzle,
    Rocket,
    Scale,
    ShoppingCart
} from 'lucide-react';

export default function IntroPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="bg-gradient-to-b from-pink-50 via-white to-pink-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-pink-900 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                
                <div className="container relative py-24 lg:py-32">
                    <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">프리미엄 체험단 플랫폼</span>
                        </div>
                        
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                            소량부터 무제한까지<br />
                            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                                고효율 리뷰 체험단 솔루션
                            </span>
                        </h1>
                        
                        <p className="text-xl lg:text-2xl mb-8 text-pink-100 max-w-3xl mx-auto">
                            예산 걱정 없이 원하는 만큼 진행하세요
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link 
                                href="/signup" 
                                className="btn btn-primary bg-white text-primary hover:bg-pink-50 hover:shadow-2xl px-8 py-4 text-lg group"
                            >
                                무료로 시작하기
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link 
                                href="/campaigns" 
                                className="btn border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-8 py-4 text-lg"
                            >
                                캠페인 둘러보기
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
                            {[
                                { label: '함께한 브랜드', value: '500+', icon: Award },
                                { label: '진행된 캠페인', value: '2,000+', icon: Target },
                                { label: '제작된 콘텐츠', value: '15,000+', icon: MessageSquare },
                                { label: '평균 만족도', value: '98%', icon: CheckCircle2 }
                            ].map((stat, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300"
                                >
                                    <stat.icon className="w-8 h-8 mb-3 mx-auto text-yellow-200" />
                                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                    <div className="text-sm text-pink-100">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
                    </svg>
                </div>
            </section>

            {/* Features Section - 4대 강점 */}
            <section className="py-20 lg:py-32">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-primary">
                            DAONVIEW는 무엇이 다른가요?
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            브랜드 성장을 위한 <span className="font-bold text-primary">최고의</span> 파트너가 되어드립니다
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {[
                            {
                                icon: Puzzle,
                                title: '브랜드 맞춤형 매칭',
                                subtitle: 'Brand Fit',
                                description: '단순 방문자 수보다 중요한 건 \'브랜드와의 결\'입니다. 귀사의 감성과 딱 맞는 블로거를 찾아 연결합니다.',
                                gradient: 'from-pink-500 to-rose-500',
                                borderColor: 'border-pink-200 hover:border-pink-400'
                            },
                            {
                                icon: Rocket,
                                title: '지체 없는 캠페인 런칭',
                                subtitle: 'Quick Start',
                                description: '불필요한 대기 시간을 시스템으로 줄였습니다. 신청 즉시 빠르게 모집이 시작되는 신속 프로세스.',
                                gradient: 'from-orange-500 to-red-500',
                                borderColor: 'border-orange-200 hover:border-orange-400'
                            },
                            {
                                icon: Shield,
                                title: '법적 보호 솔루션',
                                subtitle: 'Legal Protection',
                                description: '먹튀/잠수 걱정 NO. 불량 리뷰어 필터링은 기본, 제휴 법무법인을 통해 연락 두절까지 책임지고 해결합니다.',
                                gradient: 'from-blue-600 to-indigo-600',
                                borderColor: 'border-blue-200 hover:border-blue-500',
                                badge: '업계 유일',
                                highlight: true
                            },
                            {
                                icon: BarChart3,
                                title: '인사이트 성과 분석',
                                subtitle: 'Data Insight',
                                description: '단순 노출 수치를 넘어 도달, 반응 등 실제 마케팅 효율(ROI)을 한눈에 확인하세요.',
                                gradient: 'from-purple-500 to-pink-500',
                                borderColor: 'border-purple-200 hover:border-purple-400'
                            }
                        ].map((feature, idx) => (
                            <div 
                                key={idx}
                                className={`group bg-white rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${feature.borderColor} relative ${feature.highlight ? 'ring-2 ring-blue-300' : ''}`}
                            >
                                {/* 뱃지 (법적 보호에만) */}
                                {feature.badge && (
                                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                                        {feature.badge}
                                    </div>
                                )}

                                {/* 아이콘 */}
                                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <feature.icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                                </div>

                                {/* 타이틀 */}
                                <h3 className="text-lg lg:text-xl font-bold mb-2 text-primary group-hover:text-primary-dark transition-colors">
                                    {feature.title}
                                </h3>

                                {/* 서브타이틀 (영문) */}
                                <p className="text-xs lg:text-sm font-semibold text-text-secondary/60 mb-3 lg:mb-4 uppercase tracking-wide">
                                    {feature.subtitle}
                                </p>

                                {/* 설명 */}
                                <p className="text-sm lg:text-base text-text-secondary leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Unlimited Pass Section */}
            <section className="py-20 lg:py-32 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
                <div className="container">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-pink-300 rounded-3xl transform -rotate-3"></div>
                            <div className="relative bg-gradient-to-br from-primary via-primary-dark to-pink-900 text-white rounded-3xl p-12 shadow-2xl">
                                <Infinity className="w-16 h-16 mb-6 text-yellow-200" />
                                <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                                    초고효율 무제한 이용권
                                </h3>
                                <p className="text-xl text-pink-100 mb-6">
                                    한 번의 결제로 무제한 캠페인 진행
                                </p>
                                <div className="space-y-3">
                                    {[
                                        '월 정액제로 무제한 캠페인 생성',
                                        '추가 비용 없이 원하는 만큼 진행',
                                        '예산 걱정 없는 마케팅',
                                        '최대 90% 비용 절감 효과'
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-yellow-200 flex-shrink-0" />
                                            <span className="text-pink-50">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link 
                                    href="/campaigns" 
                                    className="inline-flex items-center gap-2 mt-8 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 transition-all hover:shadow-xl group"
                                >
                                    자세히 보기
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-primary">
                                예산 걱정 없이<br />
                                마음껏 진행하세요
                            </h2>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                기존 체험단 플랫폼은 캠페인마다 비용이 발생하지만, 
                                다온뷰의 무제한 이용권은 월 정액으로 무제한 캠페인을 진행할 수 있습니다.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { label: '비용 절감', value: '최대 90%', icon: TrendingUp },
                                    { label: '캠페인 수', value: '무제한', icon: Infinity },
                                    { label: '평균 ROI', value: '350%', icon: BarChart3 },
                                    { label: '만족도', value: '98%', icon: Heart }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
                                        <stat.icon className="w-8 h-8 text-primary mb-3" />
                                        <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                                        <div className="text-sm text-text-secondary">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 1+1 Campaign Section - 3개 카드 */}
            <section className="py-20 lg:py-32">
                <div className="container">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full mb-4">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">DAONVIEW만의 특별함</span>
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-primary">
                            고효율 1석 2조 솔루션
                        </h2>
                        <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                            <span className="font-bold text-primary">"구매평 체험단"</span>에 <span className="font-bold text-primary">"SNS 마케팅"</span>을 더해 시너지를 극대화하세요.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* 카드 1: 구매평 체험단 */}
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-3xl p-8 shadow-xl transform hover:scale-105 transition-all duration-300 relative">
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                                ⭐ 추천
                            </div>
                            
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <ShoppingCart className="w-8 h-8" />
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-3">구매평 체험단</h3>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">#스토어지수상승</span>
                                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">#실구매리뷰</span>
                            </div>
                            
                            <p className="text-blue-100 mb-6 leading-relaxed">
                                실제 구매 트래픽과 고퀄리티 포토리뷰로 스토어의 신뢰도와 랭킹을 동시에 높입니다.
                            </p>
                            
                            <ul className="space-y-3">
                                {[
                                    '키워드 검색 후 실제 구매 (트래픽 효과)',
                                    '스토어 찜 & 소식 알림 (관심고객 확보)',
                                    '고화질 포토 리뷰 (구매전환율 상승)'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 카드 2: 블로그 체험단 */}
                        <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-3xl p-8 shadow-xl transform hover:scale-105 transition-all duration-300 relative">
                            
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-3">블로그 체험단</h3>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">#상위노출</span>
                                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">#정보성리뷰</span>
                            </div>
                            
                            <p className="text-pink-100 mb-6 leading-relaxed">
                                네이버 검색 시 가장 먼저 노출되는 상세 리뷰로 고민하는 고객을 설득하고 유입시킵니다.
                            </p>
                            
                            <ul className="space-y-3">
                                {[
                                    '타겟 키워드 상위 노출 공략',
                                    '정보 전달 중심의 꼼꼼한 스토리텔링',
                                    '구매 링크 삽입으로 유입 경로 확보'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 카드 3: 인스타그램 체험단 */}
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-3xl p-8 shadow-xl transform hover:scale-105 transition-all duration-300 relative">
                            
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <Smartphone className="w-8 h-8" />
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-3">인스타그램 체험단</h3>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">#비주얼마케팅</span>
                                <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">#트렌드확산</span>
                            </div>
                            
                            <p className="text-purple-100 mb-6 leading-relaxed">
                                감각적인 이미지와 숏폼(릴스) 콘텐츠로 브랜드의 매력을 보여주고 인지도를 넓힙니다.
                            </p>
                            
                            <ul className="space-y-3">
                                {[
                                    '트렌디한 감성 사진 및 영상 제작',
                                    '해시태그를 통한 잠재 고객 도달',
                                    '공식 계정 태그로 팔로워 유입 유도'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-16 relative">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl lg:text-3xl font-bold text-primary mb-2">
                                왜 1석2조 체험단이 효율적일까요?
                            </h3>
                            <p className="text-text-secondary">
                                기존 방식과 비교해보세요
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
                            {/* 기존 방식 - 왼쪽 */}
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 shadow-lg border-2 border-gray-300 relative">
                                <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                    기존 방식
                                </div>
                                
                                <h4 className="text-xl font-bold text-gray-700 mb-6">
                                    따로 진행 (타 업체/개별)
                                </h4>

                                {/* 비용 */}
                                <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-600">쇼핑몰 구매평</span>
                                        <span className="text-lg font-bold text-gray-700">5,000원</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">SNS 체험단</span>
                                        <span className="text-lg font-bold text-gray-700">20,000원</span>
                                    </div>
                                    <div className="border-t border-gray-300 mt-3 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-700">총 비용</span>
                                            <span className="text-2xl font-bold text-gray-800">25,000원</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 제품 발송 */}
                                <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Package className="w-6 h-6 text-red-500" />
                                        <Package className="w-6 h-6 text-red-500" />
                                        <span className="text-red-700 font-semibold">제품 발송 2회</span>
                                    </div>
                                    <p className="text-sm text-red-600">
                                        ❌ 번거로운 과정<br />
                                        ❌ 배송비 2배<br />
                                        ❌ 관리 복잡
                                    </p>
                                </div>
                            </div>

                            {/* 중앙 화살표 */}
                            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex-col items-center">
                                <div className="bg-gradient-to-r from-primary to-pink-500 text-white rounded-full p-4 shadow-2xl">
                                    <ArrowRight className="w-8 h-8" />
                                </div>
                                <div className="mt-2 bg-white px-4 py-2 rounded-full shadow-lg border-2 border-primary">
                                    <p className="text-sm font-bold text-primary whitespace-nowrap">
                                        비용 64% 절감!
                                    </p>
                                </div>
                            </div>

                            {/* 다온뷰 방식 - 오른쪽 */}
                            <div className="bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-400 rounded-3xl p-8 shadow-2xl border-2 border-cyan-300 relative transform hover:scale-105 transition-all duration-300 hover:shadow-3xl">
                                <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                                    ⭐ 추천!
                                </div>
                                
                                <h4 className="text-xl font-bold text-white mb-6 drop-shadow-lg">
                                    1석2조 체험단 (다온뷰)
                                </h4>

                                {/* 비용 */}
                                <div className="bg-white rounded-2xl p-6 mb-4 border-2 border-cyan-200 shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-700 font-medium">구매평 + SNS 리뷰</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-primary">9,000원</span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-primary/20">
                                        <div className="flex items-center justify-center gap-2">
                                            <Sparkles className="w-5 h-5 text-primary" />
                                            <span className="text-primary font-bold">3배 저렴함!</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 제품 발송 */}
                                <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative">
                                            <Package className="w-7 h-7 text-green-600" />
                                            <CheckCircle2 className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                                        </div>
                                        <span className="text-green-700 font-bold text-lg">제품 발송 1회로 끝!</span>
                                    </div>
                                    <p className="text-sm text-green-700 font-medium">
                                        ✅ 구매평 & SNS 동시 해결<br />
                                        ✅ 배송비 절감<br />
                                        ✅ 간편한 관리
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 하단 요약 */}
                        <div className="mt-12 text-center">
                            <div className="inline-block bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 rounded-2xl p-8 border-2 border-cyan-200 shadow-xl">
                                <p className="text-2xl font-bold text-primary mb-3">
                                    💡 1석2조 체험단의 핵심 가치
                                </p>
                                <div className="grid md:grid-cols-3 gap-6 mt-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary mb-1">64%</div>
                                        <div className="text-sm text-text-secondary">비용 절감</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary mb-1">1회</div>
                                        <div className="text-sm text-text-secondary">제품 발송</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary mb-1">2배</div>
                                        <div className="text-sm text-text-secondary">마케팅 효과</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Campaign Types Section */}
            <section className="py-20 lg:py-32 bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-primary">
                            다온뷰 체험단 상품 소개
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            필요한 체험단을 선택하세요 👇
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: ShoppingBag,
                                title: '생활용품',
                                description: '일상 속 필수 아이템',
                                gradient: 'from-pink-500 to-rose-500',
                                examples: '화장품, 세제, 주방용품'
                            },
                            {
                                icon: Coffee,
                                title: '식품/음료',
                                description: '맛있는 체험의 시작',
                                gradient: 'from-orange-500 to-red-500',
                                examples: '건강식품, 음료, 간식'
                            },
                            {
                                icon: Laptop,
                                title: 'IT/전자기기',
                                description: '최신 기술 체험',
                                gradient: 'from-blue-500 to-purple-500',
                                examples: '스마트폰, 이어폰, 가전'
                            },
                            {
                                icon: Package,
                                title: '기타 상품',
                                description: '다양한 카테고리',
                                gradient: 'from-purple-500 to-pink-500',
                                examples: '패션, 도서, 반려동물'
                            }
                        ].map((type, idx) => (
                            <div 
                                key={idx}
                                className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100 cursor-pointer"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <type.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-primary">{type.title}</h3>
                                <p className="text-text-secondary mb-3">{type.description}</p>
                                <p className="text-sm text-text-secondary/70">{type.examples}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 lg:py-32">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-primary">
                            다온뷰 이용 후기
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            실제 고객들의 생생한 후기를 확인하세요
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: '김민지 대표',
                                company: '뷰티 스타트업',
                                rating: 5,
                                comment: '무제한 이용권으로 마케팅 비용을 70% 절감했어요. 소규모 브랜드에게 정말 최고의 선택입니다!',
                                avatar: '👩‍💼'
                            },
                            {
                                name: '박준호 마케터',
                                company: '식품 브랜드',
                                rating: 5,
                                comment: '1석2조 체험단 덕분에 블로그와 인스타 동시 진행으로 효과가 2배! ROI가 350%나 나왔어요.',
                                avatar: '👨‍💼'
                            },
                            {
                                name: '이서연 대표',
                                company: 'IT 액세서리',
                                rating: 5,
                                comment: '빠른 선정과 투명한 관리 시스템이 인상적이에요. 24시간 내 캠페인 시작은 정말 놀라워요!',
                                avatar: '👩‍💻'
                            }
                        ].map((testimonial, idx) => (
                            <div 
                                key={idx}
                                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-pink-100 relative"
                            >
                                <Quote className="absolute top-6 right-6 w-12 h-12 text-pink-100" />
                                <div className="relative">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-text-main mb-6 leading-relaxed italic">
                                        "{testimonial.comment}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-2xl">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-primary">{testimonial.name}</div>
                                            <div className="text-sm text-text-secondary">{testimonial.company}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 lg:py-32 bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-primary">
                            이용 방법
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            간단한 3단계로 시작하세요
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                step: '01',
                                title: '회원가입 & 캠페인 선택',
                                description: '무료 회원가입 후 원하는 캠페인을 선택하세요',
                                icon: Users,
                                color: 'bg-pink-500'
                            },
                            {
                                step: '02',
                                title: '신청 & 선정',
                                description: '간단한 신청서 작성 후 빠른 선정 결과를 받아보세요',
                                icon: CheckCircle2,
                                color: 'bg-purple-500'
                            },
                            {
                                step: '03',
                                title: '체험 & 리뷰 작성',
                                description: '제품 체험 후 솔직한 리뷰를 작성하고 포인트를 받으세요',
                                icon: Sparkles,
                                color: 'bg-rose-500'
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="relative">
                                {idx < 2 && (
                                    <div className="hidden md:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-pink-300 to-purple-300 z-0"></div>
                                )}
                                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100">
                                    <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg mb-4`}>
                                        {step.step}
                                    </div>
                                    <step.icon className="w-12 h-12 text-primary mb-4" />
                                    <h3 className="text-xl font-bold mb-3 text-primary">{step.title}</h3>
                                    <p className="text-text-secondary leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 lg:py-32">
                <div className="container">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-primary">
                                왜 DAONVIEW를<br />선택해야 할까요?
                            </h2>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                다온뷰는 스몰 브랜드를 위한 서비스에 집중합니다. 
                                합리적인 가격에 서비스를 제공하고, 효율적인 솔루션 개발에 투자하여, 
                                스몰 브랜드가 적은 비용으로 경쟁할 수 있도록 돕습니다.
                            </p>
                            
                            <div className="space-y-4">
                                {[
                                    '합리적인 가격으로 최대의 효과',
                                    '빈틈없는 관리 서비스',
                                    '실시간 성과 트래킹',
                                    '전문 매니저의 1:1 상담',
                                    '다양한 플랫폼 지원 (블로그, 인스타, 유튜브)',
                                    '투명한 리뷰 관리 시스템'
                                ].map((benefit, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-lg text-text-main">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-3xl transform rotate-3"></div>
                            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-pink-100">
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6">
                                        <Shield className="w-12 h-12 text-primary mb-4" />
                                        <h3 className="text-xl font-bold mb-2 text-primary">믿을 수 있는 플랫폼</h3>
                                        <p className="text-text-secondary">
                                            철저한 인플루언서 검증 시스템으로 품질 높은 리뷰를 보장합니다
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                                        <TrendingUp className="w-12 h-12 text-primary mb-4" />
                                        <h3 className="text-xl font-bold mb-2 text-primary">검증된 성과</h3>
                                        <p className="text-text-secondary">
                                            평균 98%의 고객 만족도와 지속적인 재구매율을 자랑합니다
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6">
                                        <Clock className="w-12 h-12 text-primary mb-4" />
                                        <h3 className="text-xl font-bold mb-2 text-primary">빠른 진행</h3>
                                        <p className="text-text-secondary">
                                            평균 24시간 내 캠페인 시작으로 빠른 마케팅 효과를 경험하세요
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 lg:py-32 bg-gradient-to-br from-primary via-primary-dark to-pink-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                
                <div className="container relative text-center">
                    <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                        지금 바로 시작하세요
                    </h2>
                    <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
                        본질이 뛰어난 브랜드가 선택받는 환경을 만들겠습니다
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            href="/signup" 
                            className="btn bg-white text-primary hover:bg-pink-50 hover:shadow-2xl px-8 py-4 text-lg group"
                        >
                            무료로 시작하기
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            href="/contact" 
                            className="btn border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-8 py-4 text-lg"
                        >
                            문의하기
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
