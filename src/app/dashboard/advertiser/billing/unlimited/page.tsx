'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import { UNLIMITED_PLANS } from '@/constants/pricing';
import { useAuthStore } from '@/store/authStore';
import { usePortonePayment } from '@/hooks/usePortonePayment';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import CardTransferPaymentSelector from '@/components/payment/CardTransferPaymentSelector';
import {
    ArrowLeft,
    Infinity,
    CheckCircle2,
    CreditCard,
    Shield,
    Clock,
    ChevronRight,
    Zap,
} from 'lucide-react';

const FEATURES = [
    '단일 체험단 등록 무제한',
    '1석 2조 체험단 등록 무제한',
    '동시 진행 최대 30개',
    '우선 노출 혜택 제공',
    '전담 담당자 배정',
];

type PaymentMethod = 'CARD' | 'TRANSFER';
type BillingCycle = 'MONTHLY' | 'YEARLY';

function UnlimitedPaymentContent() {
    const { profile } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const planIndex = Number(searchParams?.get('plan') ?? 0);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(planIndex === 3 ? 'YEARLY' : 'MONTHLY');
    const [isProcessing, setIsProcessing] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const displayName = profile?.company_name || profile?.nickname || '광고주';
    const monthlyPlan = UNLIMITED_PLANS[0];
    const yearlyPlan = UNLIMITED_PLANS[3];
    const selectedPlan = billingCycle === 'MONTHLY' ? monthlyPlan : yearlyPlan;
    const yearlyRegularTotal = monthlyPlan.pricePerMonth * 12;
    const yearlySavedAmount = yearlyRegularTotal - yearlyPlan.total;
    const yearlyDiscountRate = Math.round((yearlySavedAmount / yearlyRegularTotal) * 100);

    const { requestPayment } = usePortonePayment();
    const { user } = useAuthStore();

    const handlePayment = async () => {
        if (!agreeTerms) {
            toast.error('이용약관에 동의해 주세요.');
            return;
        }
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        setIsProcessing(true);

        const vat = Math.floor(selectedPlan.total * 0.1);
        const totalWithVat = selectedPlan.total + vat;

        try {
            const planMonths = parseInt(selectedPlan.period.replace(/[^0-9]/g, ''), 10);
            
            const response = await requestPayment({
                paymentId: '', // 훅 내부 생성
                orderName: `다온뷰 무제한 이용권 (${selectedPlan.period})`,
                totalAmount: totalWithVat,
                customerName: displayName,
                customerEmail: user.email || 'customer@example.com',
                customerTel: user.user_metadata?.phone || user.user_metadata?.mobile || '',
                userId: user.id,
                itemType: 'UNLIMITED',
                planMonths,
                payMethod: paymentMethod,
            });

            if (response?.code != null) {
                // 결제 취소 또는 에러
                setIsProcessing(false);
                return;
            }

            // 백엔드 검증 호출
            const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: response.paymentId }),
            });

            const result = await verifyResponse.json();

            if (result.success) {
                toast.success('무제한 이용권 결제가 완료되었습니다!');
                setTimeout(() => {
                    router.push('/dashboard/advertiser/billing');
                }, 1500);
            } else {
                toast.error(`결제 실패: ${result.message}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            // 에러 메시지는 requestPayment 내부에서 toast로 노출됨
        } finally {
            setIsProcessing(false);
        }
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
                                <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-1">
                                    <div className="grid grid-cols-2 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setBillingCycle('MONTHLY')}
                                            className={`rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
                                                billingCycle === 'MONTHLY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            월간 결제
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBillingCycle('YEARLY')}
                                            className={`rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
                                                billingCycle === 'YEARLY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            연간 결제
                                            <span className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                                {yearlyDiscountRate}% 절약
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <p className="mb-3 text-xs font-bold text-emerald-700">
                                    연간 결제는 월간 12개월 기준 대비 {yearlySavedAmount.toLocaleString()}원 절약 ({yearlyDiscountRate}% 할인)됩니다.
                                </p>
                                <div
                                    className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                                        billingCycle === 'YEARLY' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-gray-50'
                                    }`}
                                >
                                    {billingCycle === 'YEARLY' && (
                                        <span className="absolute -top-2 right-2 text-[9px] font-black px-1.5 py-0.5 bg-primary text-white rounded-full">
                                            BEST
                                        </span>
                                    )}
                                    <p className="text-[10px] font-bold text-gray-400 mb-1">{selectedPlan.period}</p>
                                    <p className={`text-xl font-black ${billingCycle === 'YEARLY' ? 'text-primary' : 'text-gray-900'}`}>
                                        {selectedPlan.pricePerMonth.toLocaleString()}
                                        <span className="text-xs font-bold text-gray-400 ml-0.5">원/월</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        총 {selectedPlan.total.toLocaleString()}원
                                    </p>
                                    {billingCycle === 'YEARLY' ? (
                                        <span className="inline-block mt-1 text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                            {yearlyDiscountRate}% 할인
                                        </span>
                                    ) : (
                                        <span className="inline-block mt-1 text-[10px] font-black text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-md">
                                            매월 결제
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 결제 수단 */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard size={16} className="text-gray-500" />
                                    결제 수단
                                </h2>
                                <CardTransferPaymentSelector
                                    variant="UNLIMITED"
                                    selectedMethod={paymentMethod}
                                    cardLabel="신용카드 / 체크카드"
                                    cardDescription="VISA, MasterCard, 국내 전 카드사"
                                    transferDescription="실시간 계좌이체, 주요 은행 지원"
                                    onSelect={(method) => setPaymentMethod(method)}
                                />
                            </div>

                            {/* 포함 혜택 */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap size={16} className="text-amber-500" />
                                    이용권 포함 혜택
                                </h2>
                                <ul className="space-y-2.5">
                                    {FEATURES.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle2 size={14} className="text-primary shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* 오른쪽: 주문 요약 */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-8 space-y-4">
                                {/* 주문 요약 카드 */}
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                    <h2 className="text-base font-black text-gray-900 mb-5">결제 요약</h2>

                                    {/* 약관 동의 (우측 결제 흐름) */}
                                    <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-gray-500" />
                                                <p className="text-sm font-bold text-gray-800">무제한 이용권 이용약관</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsTermsModalOpen(true)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80"
                                            >
                                                전문 보기
                                                <ChevronRight size={12} />
                                            </button>
                                        </div>
                                        <label className="mt-3 flex items-center gap-2 cursor-pointer">
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
                                        disabled={isProcessing}
                                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                                            isProcessing
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : agreeTerms
                                                    ? 'bg-gray-900 text-white hover:bg-black shadow-lg'
                                                    : 'bg-gray-900 text-white hover:bg-black shadow-lg'
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

            <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>무제한 이용권 이용약관</DialogTitle>
                        <DialogDescription>
                            아래 규정을 결제 전 반드시 확인해 주세요.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">
                        <p className="font-bold text-gray-800">[무제한 이용권 이용약관 및 환불 규정]</p>
                        <p className="mt-3 font-bold text-gray-800">1. 서비스 이용 및 결제</p>
                        <p className="mt-1">무제한 이용권은 선결제 방식으로 진행되며, 월간/연간 구독형으로 운영됩니다.</p>
                        <p className="mt-1">결제 완료 즉시 캠페인 등록 및 플랫폼 내 모든 유료 솔루션(AI 진단 등) 이용 권한이 부여됩니다.</p>

                        <p className="mt-3 font-bold text-gray-800">2. 청약철회 및 환불 기준</p>
                        <p className="mt-1">전액 환불: 결제 후 7일 이내에 캠페인 등록, AI 진단 도구 사용 등 유료 기능을 전혀 이용하지 않은 경우에 한합니다.</p>
                        <p className="mt-1">월간 구독: 유료 기능 이용 시작(캠페인 등록 시 등) 후에는 당월 이용료에 대한 환불이 불가하며, 해지 시 다음 결제일부터 과금되지 않습니다.</p>
                        <p className="mt-1">연간 구독: 중도 해지 시, 이용 기간을 할인 없는 월간 정상가로 소급 계산하여 차감하며, 잔여 금액의 10%를 해지 위약금으로 공제 후 환불합니다.</p>

                        <p className="mt-3 font-bold text-gray-800">3. 인플루언서 지급금 관련 (중요)</p>
                        <p className="mt-1">캠페인 진행을 위해 인플루언서에게 지급되는 별도의 실비(구매비, 제작비 등)는 당첨자 선정 및 이행 시작 시점부터 환불이 절대 불가합니다.</p>

                        <p className="mt-3 font-bold text-gray-800">4. 이용 제한 및 정지</p>
                        <p className="mt-1">이용 기간 종료 시 캠페인 관리 및 신규 모집 권한이 제한될 수 있으나, 기존 진행 중인 데이터는 재이용 시 연결하여 진행 가능합니다.</p>
                    </div>
                </DialogContent>
            </Dialog>
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
