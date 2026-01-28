'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Check, CreditCard, Building2, Save, Info, Handshake } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { CampaignActionButtons } from './CampaignActionButtons';
import { useAuthStore } from '@/store/authStore';

interface Step3Data {
    paymentMethod: 'card' | 'transfer' | 'free' | null;
    agreeToTerms: boolean;
    agreeToRefund: boolean;
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

    // 비용 계산
    const calculateCosts = () => {
        const recruitmentCount = parseInt(formData.totalRecruitment) || 0;

        // 선택된 플랫폼 개수 확인
        const selectedPlatforms = [
            formData.includeReview,
            formData.includeNaver,
            formData.includeInstagram
        ].filter(Boolean).length;

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
        const productPayment = parseInt(formData.productPrice?.replace(/,/g, '') || '0') || 0;

        // 소계 (구매평 비용 + 상품 결제금액)
        const subtotal = totalReviewCost + productPayment;

        // 부가세 (10%)
        const vat = Math.floor(subtotal * 0.1);

        // 총 결제 금액
        const totalCost = subtotal + vat;

        // 선택된 플랫폼 이름 배열
        const selectedPlatformNames = [];
        if (formData.includeReview) selectedPlatformNames.push('구매평');
        if (formData.includeNaver) selectedPlatformNames.push('네이버');
        if (formData.includeInstagram) selectedPlatformNames.push('인스타');

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

    // 폼 유효성 검사
    const isFormValid = () => {
        if (!formData.paymentMethod) return false;
        if (!formData.agreeToTerms) return false;
        if (!formData.agreeToRefund) return false;
        return true;
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            toast.error('결제 방법 선택 및 약관 동의가 필요합니다.');
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
                            <span className="text-gray-700">상품 결제금액</span>
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
                        <span className="text-gray-700">
                            {costs.selectedPlatformNames.join('+')} 비용 ({costs.recruitmentCount}명 × {costs.reviewCostPerPerson.toLocaleString()}원)
                        </span>
                        <span className="font-medium text-gray-900">
                            {costs.totalReviewCost.toLocaleString()}원
                        </span>
                    </div>

                    {costs.productPayment > 0 && (
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <span className="text-gray-700">상품 결제금액</span>
                            <span className="font-medium text-gray-900">
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
                        <span className="text-2xl font-bold text-blue-600">
                            {costs.totalCost.toLocaleString()}원
                        </span>
                    </div>
                </div>

                <div className="mt-6 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-indigo-700 leading-relaxed font-medium">
                        <strong className="font-bold">안내:</strong> 캠페인이 승인되면 결제가 진행됩니다. 승인 전까지는 실제 결제가 이루어지지 않으니 안심하고 등록하세요.
                    </p>
                </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">결제 방법</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 제휴 및 프로모션 */}
                    <button
                        onClick={() => store.setField('paymentMethod', 'free')}
                        className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center ${formData.paymentMethod === 'free'
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-rose-300'
                            }`}
                    >
                        <Handshake className={`mb-3 ${formData.paymentMethod === 'free' ? 'text-rose-500' : 'text-gray-400'}`} size={28} />
                        <h3 className="font-bold text-base mb-1">제휴 및 프로모션</h3>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">별도 협의된 무료 진행</p>
                    </button>

                    {/* 카드 결제 */}
                    <div
                        className="p-6 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 opacity-50 grayscale cursor-not-allowed relative overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[9px] font-bold tracking-tighter">준비중</div>
                        <CreditCard className="text-gray-400 mb-3" size={28} />
                        <h3 className="font-bold text-gray-400 text-base">신용/체크카드</h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium">현재 전자결제 준비중입니다</p>
                    </div>

                    {/* 계좌이체 */}
                    <button
                        onClick={() => store.setField('paymentMethod', 'transfer')}
                        className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center ${formData.paymentMethod === 'transfer'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <Building2 className={`mb-3 ${formData.paymentMethod === 'transfer' ? 'text-blue-500' : 'text-gray-400'}`} size={28} />
                        <h3 className="font-bold text-base">계좌이체</h3>
                        <p className="text-xs text-gray-500 mt-1">입금 확인 후 승인됩니다</p>
                    </button>
                </div>

                {/* 계좌 정보 (계좌이체 선택 시) */}
                {formData.paymentMethod === 'transfer' && (
                    <div className="mt-4 p-5 bg-amber-50/50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                            <span className="text-sm font-bold text-amber-900">입금 계좌 안내</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-1 bg-[#FEE500] text-[#3C1E1E] rounded font-bold text-[12px] shadow-sm">카카오뱅크</span>
                                <span className="text-lg font-black text-gray-900 tracking-tight">3333-36-4120453</span>
                            </div>
                            <p className="text-sm text-gray-700 font-bold ml-1">
                                예금주: <span className="text-blue-600">신지호(다온컴퍼니)</span>
                            </p>
                            <p className="text-xs text-amber-700 mt-1 ml-1 opacity-80">
                                * 캠페인 등록 후 위 계좌로 입금해 주시면 확인 후 즉시 승인 처리됩니다.
                            </p>
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

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-1">
                            <input
                                type="checkbox"
                                checked={formData.agreeToRefund}
                                onChange={(e) => store.setField('agreeToRefund', e.target.checked)}
                                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                환불 정책에 동의합니다 <span className="text-red-500">*</span>
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                                캠페인 시작 전 취소 시 전액 환불, 진행 중 취소 시 부분 환불됩니다.
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
