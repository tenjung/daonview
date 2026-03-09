'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import { UNLIMITED_PLANS } from '@/constants/pricing';
import { useAuthStore } from '@/store/authStore';
import { usePortonePayment } from '@/hooks/usePortonePayment';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Infinity,
    CheckCircle2,
    CreditCard,
    Shield,
    Lock,
    Clock,
    ChevronRight,
    Zap,
    MessageCircle,
} from 'lucide-react';

const FEATURES = [
    '단일 체험단 등록 무제한',
    '1석 2조 체험단 등록 무제한',
    '동시 진행 최대 30개',
    '우선 노출 혜택 제공',
    '전담 담당자 배정',
];

function UnlimitedPaymentContent() {
    const { profile } = useAuthStore();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const displayName = profile?.company_name || profile?.nickname || '광고주';
    const selectedPlan = UNLIMITED_PLANS[0];

    const { requestIssueBillingKey } = usePortonePayment();
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

            const response = await requestIssueBillingKey({
                issueName: `다온뷰 무제한 월 이용권 (${selectedPlan.period})`,
                customerName: displayName,
                customerEmail: user.email || 'customer@example.com',
                customerTel: user.user_metadata?.phone || user.user_metadata?.mobile || '',
                userId: user.id,
                itemType: 'UNLIMITED',
                planMonths,
            });

            if (response?.code != null) {
                setIsProcessing(false);
                return;
            }

            const verifyResponse = await fetch('/api/payments/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billingKey: response.billingKey, userId: user.id, planMonths, totalAmount: totalWithVat }),
            });

            const result = await verifyResponse.json();

            if (result.success) {
                toast.success('무제한 월 이용권 결제가 완료되었습니다!');
                setTimeout(() => {
                    router.push('/dashboard/advertiser/billing');
                }, 1500);
            } else {
                toast.error(`결제 실패: ${result.message}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
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
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">무제한 월 이용권 결제</h1>
                        </div>
                        <p className="text-gray-500 mt-1 ml-[52px]">
                            다온뷰의 모든 체험단을 제한 없이 이용하세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* ── 왼쪽 컬럼 ── */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* 선택된 이용권 + 혜택 통합 카드 */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-purple-500" />
                                    선택된 이용권
                                </h2>

                                <div className="relative rounded-2xl border-2 border-purple-500 bg-purple-50 p-5 text-left">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="text-sm font-black text-purple-700">무제한 월 이용권</p>
                                        <span className="inline-block px-2.5 py-1 bg-white rounded-md text-[10px] font-black text-purple-600 shadow-sm border border-purple-100">
                                            매월 자동 결제
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <p className="text-3xl font-black text-gray-900">
                                            {selectedPlan.pricePerMonth.toLocaleString()}
                                        </p>
                                        <span className="text-sm font-bold text-gray-500">원/월</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">
                                        VAT 별도 · 부가세 포함 시 {totalWithVat.toLocaleString()}원/월
                                    </p>
                                </div>

                                {/* 혜택 리스트 */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap size={14} className="text-amber-500" />
                                        <p className="text-xs font-black text-gray-700 uppercase tracking-wide">이용권 포함 혜택</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {FEATURES.map((f, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                                                <CheckCircle2 size={13} className="text-purple-500 shrink-0 mt-0.5" />
                                                <span className="text-xs text-gray-600 leading-snug font-medium">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 결제 수단 - 카드 전용 */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                                        <CreditCard size={16} className="text-gray-500" />
                                        결제 수단
                                    </h2>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                        <Lock size={11} className="text-green-500" />
                                        <span>데이터 암호화 처리</span>
                                    </div>
                                </div>

                                {/* 카드 전용 고정 UI */}
                                <div className="flex items-center p-5 rounded-2xl border-2 border-purple-500 bg-purple-50">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-5 h-5 rounded-full border-2 border-purple-500 bg-purple-500 flex items-center justify-center shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-purple-100/50 text-purple-600">
                                            <CreditCard size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[15px] text-gray-900 leading-none mb-1">신용카드 / 체크카드</span>
                                            <span className="text-[13px] text-gray-500 font-medium">VISA, MasterCard, 국내 전 카드사</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-3 px-1">
                                    정기결제(자동 갱신)는 카드 결제만 지원됩니다. 등록된 카드로 매월 자동 결제됩니다.
                                </p>
                            </div>
                        </div>

                        {/* ── 오른쪽 컬럼: 결제 요약 ── */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-8">
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                    <h2 className="text-base font-black text-gray-900 mb-5">결제 요약</h2>

                                    {/* 약관 동의 */}
                                    <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-gray-500" />
                                                <p className="text-sm font-bold text-gray-800">무제한 월 이용권 이용약관</p>
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

                                    {/* 선택된 플랜 요약 */}
                                    <div className="bg-purple-50/80 border border-purple-100/50 rounded-2xl p-5 mb-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <Infinity size={12} className="text-purple-600" />
                                                </div>
                                                <span className="text-sm font-black text-purple-700">무제한 월 이용권</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100/50 px-2 py-1 rounded-md">매월 결제</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-gray-900">
                                                {selectedPlan.total.toLocaleString()}<span className="text-sm font-bold text-gray-500 ml-0.5">원</span>
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">VAT 별도 금액</p>
                                        </div>
                                    </div>

                                    {/* 금액 내역 */}
                                    <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4 mb-4">
                                        <div className="flex justify-between text-gray-500">
                                            <span>공급가액</span>
                                            <span className="font-medium text-gray-700">{selectedPlan.total.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>부가세 (10%)</span>
                                            <span className="font-medium text-gray-700">+{vat.toLocaleString()}원</span>
                                        </div>
                                    </div>

                                    {/* 최종 금액 */}
                                    <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-2">
                                        <div>
                                            <span className="font-black text-gray-900">최종 결제금액</span>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">부가세(VAT) 포함</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-primary">
                                                {totalWithVat.toLocaleString()}
                                            </span>
                                            <span className="text-base font-black text-primary ml-0.5">원</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 text-right mb-6">
                                        매월 자동 결제 · 언제든지 해지 가능
                                    </p>

                                    {/* 결제 버튼 */}
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                                            isProcessing
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-900 text-white hover:bg-black shadow-lg active:scale-[0.99]'
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

                                    {/* 신뢰 배지 */}
                                    <div className="mt-4 flex items-center justify-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                                            <Lock size={11} className="text-green-500" />
                                            SSL 보안
                                        </div>
                                        <div className="w-px h-3 bg-gray-200" />
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                                            <Shield size={11} className="text-blue-500" />
                                            개인정보 암호화
                                        </div>
                                        <div className="w-px h-3 bg-gray-200" />
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                                            <CheckCircle2 size={11} className="text-purple-500" />
                                            안전 결제
                                        </div>
                                    </div>

                                    {/* 1:1 문의 */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <p className="text-xs text-gray-400">결제 전 궁금하신 점이 있으신가요?</p>
                                        <Link
                                            href="/contact"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-primary transition-colors"
                                        >
                                            <MessageCircle size={12} />
                                            1:1 문의
                                            <ChevronRight size={11} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>무제한 월 이용권 이용약관</DialogTitle>
                        <DialogDescription>
                            아래 규정을 결제 전 반드시 확인해 주세요.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">
                        <p className="font-bold text-gray-800">[무제한 월 이용권 이용약관 및 환불 규정]</p>
                        <p className="mt-3 font-bold text-gray-800">1. 서비스 이용 및 결제</p>
                        <p className="mt-1">무제한 월 이용권은 선결제 방식으로 진행되며, 월간 구독형으로 운영됩니다.</p>
                        <p className="mt-1">결제 완료 즉시 캠페인 등록 및 진행 서비스 이용 권한이 부여됩니다.</p>

                        <p className="mt-3 font-bold text-gray-800">2. 청약철회 및 환불 기준</p>
                        <p className="mt-1">전액 환불: 결제 후 7일 이내에 캠페인 등록 등 서비스를 전혀 이용하지 않은 경우에 한합니다.</p>
                        <p className="mt-1">유료 기능 이용 시작(캠페인 등록 등) 후에는 당월 이용료에 대한 환불이 불가하며, 해지 시 다음 결제일부터 과금되지 않습니다.</p>

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
