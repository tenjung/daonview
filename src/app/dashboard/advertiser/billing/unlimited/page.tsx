'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import { useAuthStore } from '@/store/authStore';
import {
    ArrowLeft,
    Infinity,
    CheckCircle2,
    CreditCard,
    Shield,
    Clock,
    ChevronRight,
    Star,
    Zap,
} from 'lucide-react';

const UNLIMITED_PLANS = [
    { period: '1개월', pricePerMonth: 250000, total: 250000, discount: null, highlight: false },
    { period: '3개월', pricePerMonth: 219000, total: 657000, discount: 13, highlight: false },
    { period: '6개월', pricePerMonth: 179000, total: 1074000, discount: 29, highlight: false },
    { period: '12개월', pricePerMonth: 139000, total: 1668000, discount: 45, highlight: true },
];

const FEATURES = [
    '단일 체험단 등록 무제한',
    '1석 2조 체험단 등록 무제한',
    '동시 진행 최대 30개',
    '우선 노출 혜택 제공',
    '전담 담당자 매칭',
];

function UnlimitedPaymentContent() {
    const { profile } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const planIndex = Number(searchParams?.get('plan') ?? 0);

    const [selectedPlan, setSelectedPlan] = useState(
        UNLIMITED_PLANS[planIndex] ?? UNLIMITED_PLANS[0]
    );
    const [selectedPlanIdx, setSelectedPlanIdx] = useState(
        planIndex < UNLIMITED_PLANS.length ? planIndex : 0
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const displayName = profile?.company_name || profile?.nickname || '광고주';

    const handleSelectPlan = (idx: number) => {
        setSelectedPlanIdx(idx);
        setSelectedPlan(UNLIMITED_PLANS[idx]);
    };

    const handlePayment = async () => {
        if (!agreeTerms) {
            alert('이용약관에 동의해 주세요.');
            return;
        }
        setIsProcessing(true);

        // TODO: PortOne 결제 연동 시 여기에 구현
        // 현재는 문의 안내로 대체
        setTimeout(() => {
            setIsProcessing(false);
            alert('결제 연동 준비 중입니다.\n담당자에게 문의해 주시면 빠르게 처리해 드리겠습니다.\n\n📞 카카오톡 채널: @다온뷰');
        }, 800);
    };

    const vat = Math.floor(selectedPlan.total * 0.1);
    const totalWithVat = selectedPlan.total + vat;

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={displayName}
                links={ADVERTISER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser/pricing',
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[900px] mx-auto">

                    {/* 뒤로가기 */}
                    <Link
                        href="/dashboard/advertiser/pricing"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        이용요금 안내로 돌아가기
                    </Link>

                    {/* 헤더 */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Infinity className="w-5 h-5 text-purple-600" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">무제한 이용권 결제</h1>
                        </div>
                        <p className="text-gray-500 mt-1 ml-[52px]">
                            다온뷰의 모든 체험단을 제한 없이 이용하세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* 왼쪽: 플랜 선택 + 결제 */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* 플랜 선택 */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-purple-500" />
                                    이용 기간 선택
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {UNLIMITED_PLANS.map((plan, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectPlan(i)}
                                            className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                                                selectedPlanIdx === i
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                            }`}
                                        >
                                            {plan.highlight && (
                                                <span className="absolute -top-2 right-2 text-[9px] font-black px-1.5 py-0.5 bg-primary text-white rounded-full">
                                                    BEST
                                                </span>
                                            )}
                                            <p className="text-[10px] font-bold text-gray-400 mb-1">{plan.period}</p>
                                            <p className={`text-xl font-black ${plan.highlight ? 'text-primary' : 'text-gray-900'}`}>
                                                {plan.pricePerMonth.toLocaleString()}
                                                <span className="text-xs font-bold text-gray-400 ml-0.5">원/월</span>
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                총 {plan.total.toLocaleString()}원
                                            </p>
                                            {plan.discount && (
                                                <span className="inline-block mt-1 text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                                    {plan.discount}% 할인
                                                </span>
                                            )}
                                            {selectedPlanIdx === i && (
                                                <CheckCircle2 size={16} className="absolute top-3 right-3 text-purple-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 결제 수단 */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard size={16} className="text-gray-500" />
                                    결제 수단
                                </h2>
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-purple-500 bg-purple-50 cursor-pointer">
                                        <input type="radio" name="payment" defaultChecked className="accent-purple-500" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">신용카드 / 체크카드</p>
                                            <p className="text-xs text-gray-400 mt-0.5">VISA, MasterCard, 국내 전 카드사</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 cursor-pointer opacity-50">
                                        <input type="radio" name="payment" disabled className="accent-purple-500" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">무통장 입금</p>
                                            <p className="text-xs text-gray-400 mt-0.5">준비 중</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* 약관 동의 */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield size={16} className="text-gray-500" />
                                    약관 동의
                                </h2>
                                <div className="space-y-3 text-sm text-gray-500 mb-4 bg-gray-50 rounded-2xl p-4 max-h-36 overflow-y-auto leading-relaxed">
                                    <p className="font-bold text-gray-700">무제한 이용권 이용약관</p>
                                    <p>• 무제한 이용권은 선결제 방식으로 진행됩니다.</p>
                                    <p>• 진행 수량이 전혀 없는 경우 100% 환불 가능합니다.</p>
                                    <p>• 진행 수량이 있는 경우, 1개월권 정가 기준으로 사용한 일수를 일할 계산하여 차감 후 나머지 금액을 환불합니다.</p>
                                    <p>• 이용 기간이 종료되면 캠페인 모집이 자동 중단됩니다.</p>
                                    <p>• 무제한 이용권 재이용 시, 일시 정지된 캠페인을 그대로 이어서 이용할 수 있습니다.</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        className="w-4 h-4 accent-purple-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        위 이용약관에 동의합니다.
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* 오른쪽: 주문 요약 */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-8 space-y-4">
                                {/* 주문 요약 카드 */}
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                    <h2 className="text-base font-black text-gray-900 mb-5">결제 요약</h2>

                                    {/* 선택된 플랜 */}
                                    <div className="bg-purple-50 rounded-2xl p-4 mb-5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Infinity size={14} className="text-purple-500" />
                                            <span className="text-sm font-black text-purple-700">무제한 이용권</span>
                                        </div>
                                        <p className="text-xl font-black text-gray-900">
                                            {selectedPlan.period}
                                            {selectedPlan.discount && (
                                                <span className="ml-2 text-xs font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg">
                                                    {selectedPlan.discount}% 할인
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            월 {selectedPlan.pricePerMonth.toLocaleString()}원 × {selectedPlan.period.replace('개월', '')}개월
                                        </p>
                                    </div>

                                    {/* 금액 내역 */}
                                    <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4 mb-4">
                                        <div className="flex justify-between text-gray-500">
                                            <span>공급가액</span>
                                            <span className="font-medium text-gray-700">{selectedPlan.total.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>부가세 (10%)</span>
                                            <span className="font-medium text-gray-700">{vat.toLocaleString()}원</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-6">
                                        <span className="font-black text-gray-900">최종 결제금액</span>
                                        <span className="text-2xl font-black text-primary">
                                            {totalWithVat.toLocaleString()}원
                                        </span>
                                    </div>

                                    {/* 결제 버튼 */}
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !agreeTerms}
                                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                                            agreeTerms && !isProcessing
                                                ? 'bg-gray-900 text-white hover:bg-black shadow-lg'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                처리 중...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard size={16} />
                                                {totalWithVat.toLocaleString()}원 결제하기
                                            </>
                                        )}
                                    </button>

                                    <p className="text-[11px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                                        <Shield size={11} />
                                        SSL 보안 결제 · 개인정보 암호화 처리
                                    </p>
                                </div>

                                {/* 포함 혜택 */}
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                    <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5">
                                        <Zap size={14} className="text-amber-500" />
                                        이용권 포함 혜택
                                    </h3>
                                    <ul className="space-y-2.5">
                                        {FEATURES.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle2 size={14} className="text-primary shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* 문의 */}
                                <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">결제 전 궁금하신 점이 있으신가요?</p>
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-primary transition-colors"
                                    >
                                        1:1 문의하기
                                        <ChevronRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function UnlimitedPaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen bg-background items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
        }>
            <UnlimitedPaymentContent />
        </Suspense>
    );
}
