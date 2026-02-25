'use client';

import { useState, useEffect, useRef } from 'react';
import { Handshake, CreditCard, Building2, Info, Check, ChevronRight, ChevronLeft, Gift, ShoppingBag, Search, Loader2, CheckCircle2, Infinity } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CampaignActionButtons } from './CampaignActionButtons';
import { useAuthStore } from '@/store/authStore';
import { usePortonePayment } from '@/hooks/usePortonePayment';
import { useSubscription } from '@/hooks/useSubscription';

interface Step3Data {
    paymentMethod: 'card' | 'transfer' | 'free' | null;
    agreeToTerms: boolean;

}

interface CampaignStep3Props {
    onSubmit: (data?: any) => void;
    onPrev: () => void;
    onSaveDraft: () => void;
    initialData?: Partial<Step3Data>;
    submitTrigger?: number;
}

import { useCampaignStore } from '@/store/campaignStore';

export default function CampaignStep3({
    onSubmit,
    onPrev,
    onSaveDraft,
    submitTrigger = 0,
}: CampaignStep3Props) {
    const store = useCampaignStore();
    const formData = store;

    // HUD 버튼 연동
    const lastTrigger = useRef(submitTrigger);
    useEffect(() => {
        if (submitTrigger > 0 && submitTrigger !== lastTrigger.current) {
            lastTrigger.current = submitTrigger;
            handleSubmit();
        }
    }, [submitTrigger]);

    const { user } = useAuthStore();
    const isAdmin = user?.user_metadata?.role === 'admin';
    const { requestPayment } = usePortonePayment();
    const { isUnlimited } = useSubscription();

    // 무제한 이용권 자동 선택
    useEffect(() => {
        if (isUnlimited && !formData.paymentMethod) {
            store.updateFields({
                paymentMethod: 'free',
                promotionType: 'UNLIMITED'
            });
        }
    }, [isUnlimited, formData.paymentMethod, store.updateFields]);

    // 비용 계산
    const calculateCosts = () => {
        const recruitmentCount = parseInt(formData.totalRecruitment) || 0;

        // 선택된 플랫폼 이름 배열
        const selectedPlatformNames = [];
        if (formData.includeReview) selectedPlatformNames.push('구매평');
        if (formData.includeNaver) selectedPlatformNames.push('네이버');
        if (formData.includeInstagram) selectedPlatformNames.push('인스타');

        // 선택된 플랫폼 개수 확인
        const selectedPlatforms = [
            formData.includeReview,
            formData.includeNaver,
            formData.includeInstagram
        ].filter(Boolean).length;

        // 무제한 이용권 구독자는 진행비 0원
        if (isUnlimited) {
            const productPayment = parseInt(formData.productPrice?.replace(/,/g, '') || '0') || 0;
            const subtotal = productPayment;
            const vat = Math.floor(subtotal * 0.1);
            const totalCost = subtotal + vat;

            return {
                recruitmentCount,
                reviewCostPerPerson: 0,
                totalReviewCost: 0,
                productPayment,
                subtotal,
                vat,
                totalCost,
                selectedPlatformNames,
                isUnlimitedFree: true,
            };
        }

        // 플랫폼별 가격 계산
        let reviewCostPerPerson = 0;

        if (selectedPlatforms === 1) {
            // 단독 플랫폼: 모두 5,000원
            reviewCostPerPerson = 5000;
        } else if (selectedPlatforms === 2) {
            // 구매평 + 추가 1개: 할인가 9,000원
            reviewCostPerPerson = 9000;
        }
        // selectedPlatforms === 3은 불가능 (네이버 OR 인스타만 선택 가능)

        const totalReviewCost = recruitmentCount * reviewCostPerPerson;

        // 상품 결제 금액 (Step1에서 입력한 productPrice)
        let productPayment = 0;
        const baseProductPrice = parseInt(formData.productPrice?.replace(/,/g, '') || '0') || 0;
        
        if (formData.campaignType === 'DELIVERY' && (formData.includeReview || formData.platform === 'PURCHASE')) {
            if (formData.purchaseRewardMethod === 'DAONVIEW') {
                // 다온뷰 안심결제: (상품가 + 10% 수수료) * 인원수
                const priceWithFee = Math.round(baseProductPrice * 1.1);
                productPayment = priceWithFee * recruitmentCount;
            } else {
                // 직접 지급: 구매평이어도 다온뷰 결제금액은 0원
                productPayment = 0;
            }
        } else {
            // 그 외 일반 배송/방문 (옵션 금액 등)
            productPayment = baseProductPrice * recruitmentCount;
        }

        // 소계 (캠페인 리뷰 진행 비용 + 상품 결제금액)
        const subtotal = totalReviewCost + productPayment;

        // 부가세 (10%)
        const vat = Math.floor(subtotal * 0.1);

        // 총 결제 금액
        const totalCost = subtotal + vat;

        return {
            recruitmentCount,
            reviewCostPerPerson,
            totalReviewCost,
            productPayment,
            subtotal,
            vat,
            totalCost,
            selectedPlatformNames,
        };
    };

    const costs = calculateCosts();

    // 쿠폰 검증 상태
    const [couponCode, setCouponCode] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [validatedCoupon, setValidatedCoupon] = useState<any>(null);

    // 쿠폰 검증 핸들러
    const handleVerifyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('쿠폰 코드를 입력해 주세요.');
            return;
        }

        setIsValidatingCoupon(true);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.trim().toUpperCase())
                .eq('status', 'AVAILABLE')
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                toast.error('유효하지 않거나 이미 사용된 쿠폰입니다.');
                setValidatedCoupon(null);
                store.updateFields({ promotionType: null, couponCode: '' });
            } else {
                // 만료 체크
                if (new Date(data.expires_at) < new Date()) {
                    toast.error('만료된 쿠폰입니다.');
                    setValidatedCoupon(null);
                    store.updateFields({ promotionType: null, couponCode: '' });
                } else {
                    toast.success('쿠폰이 성공적으로 적용되었습니다!');
                    setValidatedCoupon(data);
                    store.updateFields({ 
                        promotionType: 'COUPON', 
                        couponCode: data.code,
                        paymentMethod: 'free'
                    });
                }
            }
        } catch (error) {
            console.error('Coupon verification error:', error);
            toast.error('쿠폰 확인 중 오류가 발생했습니다.');
        } finally {
            setIsValidatingCoupon(false);
        }
    };
    const handleCardPayment = async () => {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        // 결제 금액 검증
        if (!costs.totalCost || costs.totalCost <= 0) {
            toast.error('결제 금액이 올바르지 않습니다. 캠페인 정보를 확인해주세요.');
            console.error('Invalid totalCost:', costs);
            return;
        }

        try {
            // 결제 ID 생성 (고유값)
            const paymentId = `campaign-${Date.now()}`;
            
            // INICIS V2 필수 정보(이메일 등) 포함하여 호출
            const response = await requestPayment({
                paymentId: '', // Hook 내부에서 안전한 Hex ID로 자동 생성됨
                orderName: formData.campaignTitle || '다온뷰 캠페인',
                totalAmount: costs.totalCost,
                customerName: formData.brandName || user.user_metadata?.name || '구매자',
                customerEmail: user.email || 'customer@example.com',
                customerTel: user.user_metadata?.phone || user.user_metadata?.mobile || '',
                userId: user.id,
                campaignId: formData.currentCampaignId && !isNaN(Number(formData.currentCampaignId)) 
                    ? Number(formData.currentCampaignId) 
                    : 0,
            });
            
            // 결제 실패/취소 시 중단 (response.code가 있으면 실패)
            if (response?.code != null) {
                return;
            }

            console.log('Payment request successful:', response);

            // 결제 방법 상태 업데이트
            store.setField('paymentMethod', 'card');
        } catch (error) {
            console.error('Card payment error:', error);
            // 에러 처리는 Hook 내부에서 toast로 표시됨
        }
    };

    // 폼 유효성 검사
    const isFormValid = () => {
        if (!formData.paymentMethod) return false;
        if (!formData.agreeToTerms) return false;

        return true;
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            toast.error('결제 방법 선택 및 약관 동의가 필요합니다.');
            return;
        }

        // 계좌이체 선택 시 입금자명 필수 체크
        if (formData.paymentMethod === 'transfer' && !formData.depositorName?.trim()) {
            toast.error('입금자명을 입력해 주세요.');
            return;
        }

        try {
            await onSubmit();
        } catch (error: any) {
            console.error('결제 처리 중 오류:', error);
            toast.error(`처리 중 오류가 발생했습니다: ${error.message || '확인되지 않은 오류'}`);
        }
    };

    return (
        <div className="w-full space-y-8 pb-10">


            {/* 캠페인 요약 */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">캠페인 요약</h2>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">캠페인 제목</span>
                        <span className="font-semibold text-gray-900">{formData.campaignTitle || '제목 없음'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">브랜드명</span>
                        <span className="font-semibold text-gray-900">{formData.brandName || '미입력'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">캠페인 유형</span>
                        <span className="font-semibold text-gray-900">
                            {formData.campaignType === 'DELIVERY' && '배송체험단'}
                            {formData.campaignType === 'VISIT' && '방문체험단'}
                            {formData.campaignType === 'PRESS' && '기자단'}
                        </span>
                    </div>

                    {/* 선택한 플랫폼 표시 */}
                    {formData.campaignType === 'DELIVERY' && (
                        <div className="flex justify-between items-start">
                            <span className="text-gray-700">선택 플랫폼</span>
                            <div className="flex flex-wrap gap-2 justify-end">
                                {formData.includeReview && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        구매평
                                    </span>
                                )}
                                {formData.includeNaver && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                        네이버 블로그
                                    </span>
                                )}
                                {formData.includeInstagram && (
                                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                        인스타그램
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {(formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">진행 채널</span>
                            <span className="font-semibold text-gray-900">
                                {formData.platform === 'BLOG' ? '네이버 블로그' : '인스타그램'}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">모집 인원</span>
                        <span className="font-semibold text-gray-900">{costs.recruitmentCount}명</span>
                    </div>

                    {costs.productPayment > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">상품 결제금액{formData.purchaseRewardMethod === 'DAONVIEW' ? ' (안심지급금)' : ''}</span>
                            <span className="font-semibold text-gray-900">
                                {costs.productPayment.toLocaleString()}원
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* 결제 금액 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 font-bold">결제 금액</h2>

                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <div className="flex flex-col gap-1">
                            <span className="text-gray-700">
                                {costs.selectedPlatformNames.join('+')} 비용 ({costs.recruitmentCount}명 × {costs.reviewCostPerPerson.toLocaleString()}원)
                            </span>
                            {isUnlimited && (
                                <span className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
                                    <Infinity size={12} /> 무제한 이용권 혜택 (전액 할인)
                                </span>
                            )}
                        </div>
                        <span className={`font-medium ${isUnlimited ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {isUnlimited 
                                ? (costs.recruitmentCount * (formData.campaignType === 'DELIVERY' ? 5000 : 10000)).toLocaleString() + '원'
                                : costs.totalReviewCost.toLocaleString() + '원'
                            }
                        </span>
                    </div>

                    {isUnlimited && (
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 text-purple-700 font-bold bg-purple-50/50 px-3 py-2 rounded-lg">
                            <span className="text-sm">무제한 이용권 할인</span>
                            <span className="text-sm">-{isUnlimited ? (costs.recruitmentCount * (formData.campaignType === 'DELIVERY' ? 5000 : 10000)).toLocaleString() : 0}원</span>
                        </div>
                    )}

                    {costs.productPayment > 0 && (
                        <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-700">상품 결제금액</span>
                                    {formData.purchaseRewardMethod === 'DAONVIEW' && <span className="text-[11px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded">안심 지급금</span>}
                                </div>
                                {formData.purchaseRewardMethod === 'DAONVIEW' && (
                                    <span className="text-[11px] text-gray-500 mt-1">
                                        ※ 부가세 10% 포함
                                    </span>
                                )}
                            </div>
                            <span className="font-medium text-gray-900 mt-0.5">
                                {costs.productPayment.toLocaleString()}원
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-700">소계</span>
                        <span className="font-medium text-gray-900">
                            {costs.subtotal.toLocaleString()}원
                        </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-700">부가세 (10%)</span>
                        <span className="font-medium text-gray-900">
                            {costs.vat.toLocaleString()}원
                        </span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                        <span className="text-lg font-bold text-gray-900">총 결제 금액</span>
                        <span className={`text-2xl font-bold ${isUnlimited && costs.totalCost === 0 ? 'text-purple-600' : 'text-blue-600'}`}>
                            {costs.totalCost.toLocaleString()}원
                        </span>
                    </div>
                </div>

                <div className="mt-6 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                        <p className="text-[13px] text-indigo-700 leading-relaxed font-medium">
                            <strong className="font-bold">서비스 제공 기간:</strong> 결제 완료 후 즉시 캠페인 등록 및 이용이 가능합니다.<br />
                            (단, 캠페인은 운영진 승인 후 오픈되며 통상 인플루언서 모집 1주일, 후기 등록 1주일의 기간이 소요됩니다.)
                        </p>
                        <div className="pt-2 border-t border-indigo-100/60">
                            <p className="text-[13px] text-indigo-700 leading-relaxed font-medium">
                                <strong className="font-bold">취소 및 환불 기준:</strong> 매칭 전 100% 환불, 모집 미달 시 차액 환불<br />
                                <strong className="font-bold">환불 불가 및 제한:</strong> 매칭 후(이행 시작 시) 환불 제한, 단순 변심 환불 불가
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">결제 방법</h2>

                <div className="flex flex-col gap-3">
                    {/* 무제한 이용권 결제 (구독자용) */}
                    {isUnlimited && (
                        <label
                            onClick={() => {
                                store.updateFields({
                                    paymentMethod: 'free',
                                    promotionType: 'UNLIMITED'
                                });
                            }}
                            className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${formData.promotionType === 'UNLIMITED' && formData.paymentMethod === 'free'
                                ? 'border-purple-500 bg-purple-50 shadow-sm'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.promotionType === 'UNLIMITED' && formData.paymentMethod === 'free' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                                    {formData.promotionType === 'UNLIMITED' && formData.paymentMethod === 'free' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                </div>
                                <div className="bg-purple-100/50 p-2.5 rounded-xl text-purple-600">
                                    <Infinity size={22} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[15px] text-gray-900 leading-none mb-1">무제한 이용권 적용</span>
                                    <span className="text-[13px] text-gray-500 font-medium">프리미엄 구독 혜택 (결제 금액 없음)</span>
                                </div>
                            </div>
                        </label>
                    )}

                    {/* 카드 결제 */}
                    <label
                        onClick={handleCardPayment}
                        className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${formData.paymentMethod === 'card'
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'card' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                {formData.paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <div className="bg-blue-100/50 p-2.5 rounded-xl text-blue-600">
                                <CreditCard size={22} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-[15px] text-gray-900 leading-none mb-1">신용 / 체크카드</span>
                                <span className="text-[13px] text-gray-500 font-medium">안전하고 빠른 간편 결제 (PG 연동)</span>
                            </div>
                        </div>
                    </label>

                    {/* 계좌이체 */}
                    <label
                        onClick={() => store.setField('paymentMethod', 'transfer')}
                        className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${formData.paymentMethod === 'transfer'
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'transfer' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                                {formData.paymentMethod === 'transfer' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <div className="bg-emerald-100/50 p-2.5 rounded-xl text-emerald-600">
                                <Building2 size={22} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-[15px] text-gray-900 leading-none mb-1">계좌이체 (무통장 입금)</span>
                                <span className="text-[13px] text-gray-500 font-medium">입금 내역 확인 후 관리자가 승인 처리</span>
                            </div>
                        </div>
                    </label>

                    {/* 제휴 및 프로모션 */}
                    <label
                        onClick={() => {
                            store.setField('paymentMethod', 'free');
                            if (formData.promotionType === 'UNLIMITED') store.setField('promotionType', 'COUPON');
                            else if (!formData.promotionType) store.setField('promotionType', 'COUPON');
                        }}
                        className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${formData.paymentMethod === 'free' && formData.promotionType !== 'UNLIMITED'
                            ? 'border-rose-500 bg-rose-50 shadow-sm'
                            : 'border-gray-200 hover:border-rose-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'free' && formData.promotionType !== 'UNLIMITED' ? 'border-rose-500 bg-rose-500' : 'border-gray-300'}`}>
                                {formData.paymentMethod === 'free' && formData.promotionType !== 'UNLIMITED' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <div className="bg-rose-100/50 p-2.5 rounded-xl text-rose-600">
                                <Handshake size={22} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-[15px] text-gray-900 leading-none mb-1">제휴 / 가상 결제</span>
                                <span className="text-[13px] text-gray-500 font-medium">프로모션 쿠폰 또는 타사 주문번호 연동</span>
                            </div>
                        </div>
                    </label>
                </div>

                {/* 프로모션 상세 선택 (제휴 및 프로모션 선택 시) */}
                {formData.paymentMethod === 'free' && (
                    <div className="mt-4 p-6 bg-rose-50/30 border-2 border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-6">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => store.setField('promotionType', 'COUPON')}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.promotionType === 'COUPON'
                                        ? 'border-rose-500 bg-white shadow-sm'
                                        : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    <Gift size={20} className={formData.promotionType === 'COUPON' ? 'text-rose-500' : 'text-slate-300'} />
                                    <span className={`font-black text-sm ${formData.promotionType === 'COUPON' ? 'text-slate-900' : 'text-slate-400'}`}>다온뷰 쿠폰 입력</span>
                                </button>
                                <button
                                    onClick={() => store.setField('promotionType', 'EXTERNAL')}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.promotionType === 'EXTERNAL'
                                        ? 'border-rose-500 bg-white shadow-sm'
                                        : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    <ShoppingBag size={20} className={formData.promotionType === 'EXTERNAL' ? 'text-rose-500' : 'text-slate-300'} />
                                    <span className={`font-black text-sm ${formData.promotionType === 'EXTERNAL' ? 'text-slate-900' : 'text-slate-400'}`}>타사(크몽 등) 주문번호</span>
                                </button>
                            </div>

                            {/* 쿠폰 입력 필드 */}
                            {formData.promotionType === 'COUPON' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative group">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="DAON-XXXX-XXXX-XXXX"
                                                className="w-full bg-white border-2 border-rose-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 placeholder:text-slate-200 focus:border-rose-500 outline-none transition-all shadow-sm group-hover:border-rose-300"
                                            />
                                            <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 group-hover:text-rose-500 transition-colors" size={20} />
                                        </div>
                                        <button
                                            onClick={handleVerifyCoupon}
                                            disabled={isValidatingCoupon}
                                            className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                                        >
                                            {isValidatingCoupon ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                            쿠폰 인증
                                        </button>
                                    </div>

                                    {validatedCoupon && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="text-emerald-500" size={20} />
                                                <div>
                                                    <p className="text-sm font-black text-emerald-900">쿠폰이 인증되었습니다!</p>
                                                    <div className="flex gap-2 mt-1">
                                                        {validatedCoupon.benefits.is_vip ? (
                                                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded">VIP 평생무료</span>
                                                        ) : (
                                                            <>
                                                                {validatedCoupon.benefits.visit_free > 0 && <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded">방문 {validatedCoupon.benefits.visit_free}회</span>}
                                                                {validatedCoupon.benefits.delivery_free > 0 && <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded">배송 {validatedCoupon.benefits.delivery_free}회</span>}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setValidatedCoupon(null);
                                                    setCouponCode('');
                                                    store.updateFields({ promotionType: null, couponCode: '' });
                                                }}
                                                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 타사 주문번호 입력 필드 */}
                            {formData.promotionType === 'EXTERNAL' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={formData.externalOrderNumber}
                                            onChange={(e) => store.setField('externalOrderNumber', e.target.value)}
                                            placeholder="크몽/숨고 등 결제하신 플랫폼의 주문번호를 입력해 주세요"
                                            className="w-full bg-white border-2 border-rose-200 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 placeholder:text-slate-200 focus:border-rose-500 outline-none transition-all shadow-sm group-hover:border-rose-300"
                                        />
                                        <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 group-hover:text-rose-500 transition-colors" size={20} />
                                    </div>
                                    <p className="text-[11px] text-rose-600 font-bold px-2 flex items-center gap-1">
                                        <Info size={12} />
                                        운영진이 주문번호 대조 후 최종 승인 처리해 드립니다.
                                    </p>
                                </div>
                            )}
                            {/* 무제한 이용권 혜택 안내 */}
                            {formData.promotionType === 'UNLIMITED' && (
                                <div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center justify-between group animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                            <Infinity size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-purple-900 leading-tight">무제한 이용권 혜택이 적용되었습니다</p>
                                            <p className="text-[11px] text-purple-600 font-bold mt-1">캠페인 진행 비용이 100% 면제됩니다.</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end gap-1">
                                        <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-1 rounded-full shadow-sm">ACTIVE PLAN</span>
                                        <span className="text-[10px] text-purple-400 font-bold">Benefit Applied</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 계좌 정보 (계좌이체 선택 시) */}
                {formData.paymentMethod === 'transfer' && (
                    <div className="mt-4 p-6 bg-amber-50/50 border-2 border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 relative overflow-hidden group">
                        {/* 배경 장식 */}
                        <div className="absolute right-0 top-0 p-4 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                            <Building2 size={100} />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                            <div className="space-y-6 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-black text-amber-900 tracking-tight">지정된 계좌로 입금해 주세요</span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1.5 bg-[#FEE500] text-[#3C1E1E] rounded-lg font-black text-[12px] shadow-sm flex-shrink-0">카카오뱅크</span>
                                        <span className="text-2xl font-black text-gray-900 tracking-tighter">3333-36-4120453</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText('카카오뱅크 3333-36-4120453');
                                                toast.success('은행과 계좌번호가 복사되었습니다.');
                                            }}
                                            className="group/copy flex items-center gap-1.5 text-[11px] font-black text-amber-700 bg-white border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-50 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                                        >
                                            <span className="opacity-70 group-hover/copy:opacity-100 italic transition-opacity">Copy</span>
                                            전체복사
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white/60 p-3 rounded-xl border border-amber-200/50">
                                            <p className="text-[11px] font-bold text-amber-600 mb-1 uppercase tracking-wider">Deposit Holder</p>
                                            <p className="text-base text-gray-900 font-extrabold">
                                                신지호<span className="text-gray-400 font-bold ml-1 text-sm">(다온컴퍼니)</span>
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border-2 border-amber-200 shadow-sm focus-within:border-amber-400 transition-colors">
                                            <p className="text-[11px] font-bold text-amber-600 mb-1 uppercase tracking-wider">Depositor Name <span className="text-rose-500">*</span></p>
                                            <input 
                                                type="text"
                                                value={formData.depositorName}
                                                onChange={(e) => store.setField('depositorName', e.target.value)}
                                                placeholder="입금자명을 입력해주세요"
                                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900 font-extrabold placeholder:text-gray-300 placeholder:font-bold text-base"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 금액 강조 영역 */}
                            <div className="bg-slate-900 px-8 py-6 rounded-3xl shadow-xl border-4 border-slate-800 text-center md:text-right min-w-[240px] transform hover:scale-[1.02] transition-transform">
                                <p className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-widest opacity-80">Total Deposit Amount</p>
                                <p className="text-3xl font-black text-white tracking-tighter">
                                    {costs.totalCost.toLocaleString()}<span className="text-xl ml-1 text-amber-100">원</span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-amber-200/50 space-y-2">
                            <div className="flex items-start gap-2 text-[12px] text-amber-900 font-bold leading-relaxed">
                                <span className="text-rose-600">●</span>
                                <p>입금자명이 신청하신 성함과 동일해야만 자동 입금 확인이 가능합니다.</p>
                            </div>
                            <div className="flex items-start gap-2 text-[12px] text-amber-800 font-medium leading-relaxed opacity-80">
                                <span className="opacity-50">●</span>
                                <p>주문 후 <span className="font-bold underline text-amber-900">14일 이내</span> 미입금 시, 주문 내역이 자동 취소됩니다.</p>
                            </div>
                            <div className="flex items-start gap-2 text-[12px] text-amber-800 font-medium leading-relaxed opacity-80">
                                <span className="opacity-50">●</span>
                                <p>캠페인 완료 시 <span className="font-bold text-blue-700">세금계산서는 자동으로 발행</span>됩니다.</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* 약관 동의 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-bold">약관 동의</h2>

                <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-1">
                            <input
                                type="checkbox"
                                checked={formData.agreeToTerms}
                                onChange={(e) => store.setField('agreeToTerms', e.target.checked)}
                                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                서비스 이용약관에 동의합니다 <span className="text-red-500">*</span>
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                                캠페인 진행 및 리뷰어 매칭 서비스 이용에 대한 약관입니다.
                            </p>
                        </div>
                    </label>
                </div>
            </section>


            <div className="bg-indigo-50/40 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                    <Check className="text-indigo-600" size={20} />
                    <h3 className="font-bold text-indigo-950 text-lg">
                        {isAdmin ? '등록 절차 안내' : '승인 절차 안내'}
                    </h3>
                </div>
                {isAdmin ? (
                    <ol className="space-y-3 text-[13px] text-indigo-700 font-medium">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold">1</span>
                            <span>등록 즉시 캠페인이 게시되며 리뷰어 모집이 시작됩니다.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold">2</span>
                            <span>결제는 등록과 동시에 진행됩니다.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold">3</span>
                            <span>대시보드에서 실시간으로 진행 상황을 확인할 수 있습니다.</span>
                        </li>
                    </ol>
                ) : (
                    <ol className="space-y-3 text-[13px] text-indigo-700 font-medium">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold">1</span>
                            <span>승인 요청 후 관리자가 캠페인 내용을 검토합니다. (영업일 기준 24시간 이내)</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold">2</span>
                            <span>승인이 완료되면 결제가 진행되고 캠페인이 게시됩니다.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold">3</span>
                            <span>리뷰어 모집이 시작되며, 대시보드에서 진행 상황을 확인할 수 있습니다.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold">4</span>
                            <span>승인이 거부된 경우 수정 가이드에 따라 재신청할 수 있습니다.</span>
                        </li>
                    </ol>
                )}
            </div>
        </div>
    );
}
