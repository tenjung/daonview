'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    Check, 
    X, 
    ShoppingCart, 
    MessageSquare, 
    Smartphone, 
    Package,
    Sparkles,
    ChevronDown,
    HelpCircle,
    ArrowRight,
    Zap,
    Crown,
    Star
} from 'lucide-react';

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState('package');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const tabs = [
        { id: 'package', label: '패키지 (할인)', icon: Package, color: 'text-primary' },
        { id: 'purchase', label: '구매평 체험단', icon: ShoppingCart, color: 'text-blue-600' },
        { id: 'blog', label: '블로그', icon: MessageSquare, color: 'text-green-600' },
        { id: 'instagram', label: '인스타그램', icon: Smartphone, color: 'text-purple-600' }
    ];

    const packagePlans = [
        {
            name: '스타터',
            price: '150,000',
            originalPrice: '200,000',
            discount: '25%',
            description: '처음 시작하는 브랜드에 최적',
            features: [
                { text: '구매평 체험단 10명', included: true },
                { text: '블로그 체험단 5명', included: true },
                { text: '인스타그램 체험단 3명', included: true },
                { text: '전담 매니저 배정', included: false },
                { text: '성과 리포트 제공', included: true },
                { text: '무제한 수정 요청', included: false }
            ],
            cta: '시작하기',
            popular: false
        },
        {
            name: '프로페셔널',
            price: '350,000',
            originalPrice: '500,000',
            discount: '30%',
            description: '가장 많이 선택하는 베스트 플랜',
            features: [
                { text: '구매평 체험단 30명', included: true },
                { text: '블로그 체험단 15명', included: true },
                { text: '인스타그램 체험단 10명', included: true },
                { text: '전담 매니저 배정', included: true },
                { text: '성과 리포트 제공', included: true },
                { text: '무제한 수정 요청', included: true }
            ],
            cta: '인기 플랜 선택',
            popular: true
        },
        {
            name: '엔터프라이즈',
            price: '맞춤 견적',
            originalPrice: null,
            discount: null,
            description: '대규모 캠페인을 위한 프리미엄',
            features: [
                { text: '구매평 체험단 무제한', included: true },
                { text: '블로그 체험단 무제한', included: true },
                { text: '인스타그램 체험단 무제한', included: true },
                { text: '전담 매니저 배정', included: true },
                { text: '실시간 성과 대시보드', included: true },
                { text: '24/7 우선 지원', included: true }
            ],
            cta: '상담 신청',
            popular: false
        }
    ];

    const purchasePlans = [
        {
            name: '베이직',
            price: '50,000',
            unit: '10명',
            features: [
                '실제 구매 트래픽',
                '고화질 포토 리뷰',
                '스토어 찜 & 알림',
                '기본 성과 리포트'
            ]
        },
        {
            name: '스탠다드',
            price: '120,000',
            unit: '30명',
            features: [
                '실제 구매 트래픽',
                '고화질 포토 리뷰',
                '스토어 찜 & 알림',
                '상세 성과 리포트',
                '전담 매니저'
            ],
            popular: true
        },
        {
            name: '프리미엄',
            price: '300,000',
            unit: '100명',
            features: [
                '실제 구매 트래픽',
                '고화질 포토 리뷰',
                '스토어 찜 & 알림',
                '실시간 대시보드',
                '전담 매니저',
                '우선 지원'
            ]
        }
    ];

    const blogPlans = [
        {
            name: '베이직',
            price: '80,000',
            unit: '5명',
            features: [
                '키워드 최적화',
                '상위 노출 공략',
                '구매 링크 삽입',
                '기본 리포트'
            ]
        },
        {
            name: '스탠다드',
            price: '180,000',
            unit: '15명',
            features: [
                '키워드 최적화',
                '상위 노출 보장',
                '구매 링크 삽입',
                '상세 리포트',
                '전담 매니저'
            ],
            popular: true
        },
        {
            name: '프리미엄',
            price: '400,000',
            unit: '50명',
            features: [
                '키워드 최적화',
                '상위 노출 보장',
                '구매 링크 삽입',
                '실시간 모니터링',
                '전담 매니저',
                '우선 지원'
            ]
        }
    ];

    const instagramPlans = [
        {
            name: '베이직',
            price: '100,000',
            unit: '5명',
            features: [
                '피드 게시물',
                '해시태그 최적화',
                '계정 태그',
                '기본 리포트'
            ]
        },
        {
            name: '스탠다드',
            price: '220,000',
            unit: '15명',
            features: [
                '피드 + 스토리',
                '해시태그 최적화',
                '계정 태그',
                '릴스 제작',
                '상세 리포트'
            ],
            popular: true
        },
        {
            name: '프리미엄',
            price: '500,000',
            unit: '50명',
            features: [
                '피드 + 스토리 + 릴스',
                '해시태그 최적화',
                '계정 태그',
                '인플루언서 매칭',
                '실시간 분석',
                '전담 매니저'
            ]
        }
    ];

    const faqs = [
        {
            question: '환불 규정은 어떻게 되나요?',
            answer: '캠페인 시작 전까지는 100% 환불이 가능합니다. 캠페인 시작 후에는 진행 상황에 따라 부분 환불이 가능하며, 자세한 사항은 고객센터로 문의해주세요.'
        },
        {
            question: '캠페인 진행 기간은 얼마나 걸리나요?',
            answer: '일반적으로 신청 후 24시간 내 캠페인이 시작되며, 전체 진행 기간은 7-14일 정도 소요됩니다. 체험단 모집부터 리뷰 작성 완료까지 평균 2주 정도 예상하시면 됩니다.'
        },
        {
            question: '여러 상품을 동시에 진행할 수 있나요?',
            answer: '네, 가능합니다. 구매평, 블로그, 인스타그램을 동시에 진행하실 수 있으며, 패키지 상품을 이용하시면 더욱 저렴하게 이용하실 수 있습니다.'
        },
        {
            question: '성과 리포트는 어떤 내용이 포함되나요?',
            answer: '리뷰 노출 수, 클릭 수, 참여율, 전환율 등 주요 지표를 포함한 상세 리포트를 제공합니다. 프리미엄 플랜의 경우 실시간 대시보드를 통해 언제든지 확인하실 수 있습니다.'
        },
        {
            question: '전담 매니저는 어떤 역할을 하나요?',
            answer: '캠페인 기획부터 진행, 리포트 작성까지 전 과정을 관리하며, 1:1 상담을 통해 최적의 마케팅 전략을 제안해드립니다. 카카오톡 또는 이메일로 실시간 소통이 가능합니다.'
        }
    ];

    const getCurrentPlans = () => {
        switch (activeTab) {
            case 'package':
                return packagePlans;
            case 'purchase':
                return purchasePlans;
            case 'blog':
                return blogPlans;
            case 'instagram':
                return instagramPlans;
            default:
                return packagePlans;
        }
    };

    return (
        <div className="bg-gradient-to-b from-pink-50 via-white to-purple-50 min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-pink-900 text-white py-20 lg:py-24">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                
                <div className="container relative text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">투명하고 합리적인 가격</span>
                    </div>
                    
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                        브랜드 성장을 위한<br />
                        <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                            최적의 플랜을 선택하세요
                        </span>
                    </h1>
                    
                    <p className="text-xl text-pink-100 max-w-2xl mx-auto mb-8">
                        필요한 서비스만 선택하거나, 패키지로 더욱 저렴하게 이용하세요
                    </p>
                </div>
            </section>

            {/* Tab Navigation */}
            <section className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-pink-100 shadow-sm">
                <div className="container">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-text-secondary hover:text-primary'
                                }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : ''}`} />
                                {tab.label}
                                {tab.id === 'package' && (
                                    <span className="bg-gradient-to-r from-primary to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        할인
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-16 lg:py-24">
                <div className="container">
                    <div className={`grid gap-8 ${activeTab === 'package' ? 'md:grid-cols-3' : 'md:grid-cols-3'} max-w-6xl mx-auto`}>
                        {getCurrentPlans().map((plan: any, idx: number) => (
                            <div
                                key={idx}
                                className={`relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${
                                    plan.popular
                                        ? 'border-primary scale-105 lg:scale-110 ring-4 ring-primary/20'
                                        : 'border-pink-100 hover:border-primary'
                                }`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="bg-gradient-to-r from-primary to-pink-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                                            <Crown className="w-4 h-4" />
                                            가장 인기있는 플랜
                                        </div>
                                    </div>
                                )}

                                {/* Discount Badge */}
                                {plan.discount && (
                                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold">
                                        {plan.discount} 할인
                                    </div>
                                )}

                                {/* Plan Name */}
                                <h3 className="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                                
                                {/* Description */}
                                {plan.description && (
                                    <p className="text-sm text-text-secondary mb-6">{plan.description}</p>
                                )}

                                {/* Price */}
                                <div className="mb-6">
                                    {plan.originalPrice && (
                                        <div className="text-sm text-text-secondary line-through mb-1">
                                            {plan.originalPrice}원
                                        </div>
                                    )}
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-primary">
                                            {plan.price}
                                        </span>
                                        {plan.price !== '맞춤 견적' && <span className="text-lg text-text-secondary">원</span>}
                                    </div>
                                    {plan.unit && (
                                        <div className="text-sm text-text-secondary mt-1">
                                            {plan.unit} 기준
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {(plan.features as any[]).map((feature: any, featureIdx: number) => (
                                        <li key={featureIdx} className="flex items-start gap-3">
                                            {typeof feature === 'string' ? (
                                                <>
                                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-text-main">{feature}</span>
                                                </>
                                            ) : (
                                                <>
                                                    {feature.included ? (
                                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <span className={`text-sm ${feature.included ? 'text-text-main' : 'text-text-secondary/50'}`}>
                                                        {feature.text}
                                                    </span>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <Link
                                    href="/contact"
                                    className={`btn w-full flex items-center justify-center gap-2 ${
                                        plan.popular
                                            ? 'btn-primary'
                                            : 'btn-outline'
                                    }`}
                                >
                                    {plan.cta || '선택하기'}
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            {activeTab === 'package' && (
                <section className="py-16 lg:py-24 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="container">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                                플랜 상세 비교
                            </h2>
                            <p className="text-lg text-text-secondary">
                                각 플랜의 차이를 한눈에 확인하세요
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-primary to-pink-500 text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold">기능</th>
                                            <th className="px-6 py-4 text-center font-semibold">스타터</th>
                                            <th className="px-6 py-4 text-center font-semibold bg-white/10">프로페셔널</th>
                                            <th className="px-6 py-4 text-center font-semibold">엔터프라이즈</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pink-100">
                                        {[
                                            { feature: '구매평 체험단', starter: '10명', pro: '30명', enterprise: '무제한' },
                                            { feature: '블로그 체험단', starter: '5명', pro: '15명', enterprise: '무제한' },
                                            { feature: '인스타그램 체험단', starter: '3명', pro: '10명', enterprise: '무제한' },
                                            { feature: '전담 매니저', starter: false, pro: true, enterprise: true },
                                            { feature: '성과 리포트', starter: true, pro: true, enterprise: true },
                                            { feature: '실시간 대시보드', starter: false, pro: false, enterprise: true },
                                            { feature: '무제한 수정 요청', starter: false, pro: true, enterprise: true },
                                            { feature: '24/7 우선 지원', starter: false, pro: false, enterprise: true }
                                        ].map((row, idx) => (
                                            <tr key={idx} className="hover:bg-pink-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-text-main">{row.feature}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {typeof row.starter === 'boolean' ? (
                                                        row.starter ? (
                                                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                        )
                                                    ) : (
                                                        <span className="text-text-secondary">{row.starter}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center bg-pink-50/50">
                                                    {typeof row.pro === 'boolean' ? (
                                                        row.pro ? (
                                                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                        )
                                                    ) : (
                                                        <span className="text-text-main font-semibold">{row.pro}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {typeof row.enterprise === 'boolean' ? (
                                                        row.enterprise ? (
                                                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                        )
                                                    ) : (
                                                        <span className="text-text-secondary">{row.enterprise}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ Section */}
            <section className="py-16 lg:py-24">
                <div className="container max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                            자주 묻는 질문
                        </h2>
                        <p className="text-lg text-text-secondary">
                            궁금하신 점을 빠르게 해결해드립니다
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-pink-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
                                            <HelpCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-semibold text-text-main">{faq.question}</span>
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 text-primary transition-transform ${
                                            openFaq === idx ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        openFaq === idx ? 'max-h-96' : 'max-h-0'
                                    }`}
                                >
                                    <div className="px-6 pb-5 pl-20 text-text-secondary leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 lg:py-24 bg-gradient-to-br from-primary via-primary-dark to-pink-900 text-white">
                <div className="container text-center">
                    <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                        아직 고민 중이신가요?
                    </h2>
                    <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
                        전문 상담을 통해 브랜드에 가장 적합한 플랜을 추천해드립니다
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="btn bg-white text-primary hover:bg-pink-50 hover:shadow-2xl px-8 py-4 text-lg group"
                        >
                            무료 상담 신청
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/campaigns"
                            className="btn border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-8 py-4 text-lg"
                        >
                            캠페인 둘러보기
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
