'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, CreditCard, Building2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Step3Data {
    paymentMethod: 'card' | 'transfer' | null;
    agreeToTerms: boolean;
    agreeToRefund: boolean;
}

interface CampaignStep3Props {
    onSubmit: (data: Step3Data) => Promise<void> | void;
    onPrev: () => void;
    onSaveDraft?: () => void;
    initialData?: Partial<Step3Data>;
    step1Data: any;
    step2Data: any;
}

export default function CampaignStep3({
    onSubmit,
    onPrev,
    onSaveDraft,
    initialData,
    step1Data,
    step2Data
}: CampaignStep3Props) {
    const [formData, setFormData] = useState<Step3Data>({
        paymentMethod: initialData?.paymentMethod || null,
        agreeToTerms: initialData?.agreeToTerms || false,
        agreeToRefund: initialData?.agreeToRefund || false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // 사용자 역할 확인
    useEffect(() => {
        const checkUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // users 테이블에서 role 확인
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setIsAdmin(userData?.role === 'admin');
            }
        };
        checkUserRole();
    }, []);

    // 비용 계산
    const calculateCosts = () => {
        const recruitmentCount = parseInt(step1Data.totalRecruitment) || 0;

        // 선택된 플랫폼 개수 확인
        const selectedPlatforms = [
            step1Data.includeReview,
            step1Data.includeNaver,
            step1Data.includeInstagram
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
        const productPayment = parseInt(step1Data.productPrice?.replace(/,/g, '') || '0') || 0;

        // 소계 (구매평 비용 + 상품 결제금액)
        const subtotal = totalReviewCost + productPayment;

        // 부가세 (10%)
        const vat = Math.floor(subtotal * 0.1);

        // 총 결제 금액
        const totalCost = subtotal + vat;

        // 선택된 플랫폼 이름 배열
        const selectedPlatformNames = [];
        if (step1Data.includeReview) selectedPlatformNames.push('구매평');
        if (step1Data.includeNaver) selectedPlatformNames.push('네이버');
        if (step1Data.includeInstagram) selectedPlatformNames.push('인스타');

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

        setIsSubmitting(true);

        try {
            await onSubmit(formData);
        } catch (error: any) {
            console.error('결제 처리 중 오류:', error);
            toast.error(`처리 중 오류가 발생했습니다: ${error.message || '확인되지 않은 오류'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">

            {/* 캠페인 요약 */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">캠페인 요약</h2>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">캠페인 제목</span>
                        <span className="font-semibold text-gray-900">{step2Data.campaignTitle || '제목 없음'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">브랜드명</span>
                        <span className="font-semibold text-gray-900">{step1Data.brandName || '미입력'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">캠페인 유형</span>
                        <span className="font-semibold text-gray-900">
                            {step1Data.campaignType === 'DELIVERY' && '배송체험단'}
                            {step1Data.campaignType === 'VISIT' && '방문체험단'}
                            {step1Data.campaignType === 'PRESS' && '기자단'}
                        </span>
                    </div>

                    {/* 선택한 플랫폼 표시 */}
                    {step1Data.campaignType === 'DELIVERY' && (
                        <div className="flex justify-between items-start">
                            <span className="text-gray-700">선택 플랫폼</span>
                            <div className="flex flex-wrap gap-2 justify-end">
                                {step1Data.includeReview && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        구매평
                                    </span>
                                )}
                                {step1Data.includeNaver && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                        네이버 블로그
                                    </span>
                                )}
                                {step1Data.includeInstagram && (
                                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                        인스타그램
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {step1Data.campaignType === 'VISIT' && step1Data.platform && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">플랫폼</span>
                            <span className="font-semibold text-gray-900">
                                {step1Data.platform === 'BLOG' && '네이버 플레이스'}
                                {step1Data.platform === 'INSTAGRAM' && '인스타그램'}
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
                <h2 className="text-xl font-bold text-gray-900 mb-6">결제 금액</h2>

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

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                        💡 <strong>안내:</strong> 캠페인이 승인되면 결제가 진행됩니다.
                        승인 전까지는 결제되지 않습니다.
                    </p>
                </div>
            </section>

            {/* 결제 방법 선택 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">결제 방법</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 카드 결제 */}
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.paymentMethod === 'card'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <CreditCard className={formData.paymentMethod === 'card' ? 'text-blue-500' : 'text-gray-400'} size={24} />
                            <h3 className="font-bold text-lg">신용/체크카드</h3>
                        </div>
                        <p className="text-sm text-gray-600 text-left">
                            즉시 결제 처리됩니다
                        </p>
                    </button>

                    {/* 계좌이체 */}
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'transfer' }))}
                        className={`p-6 rounded-lg border-2 transition-all ${formData.paymentMethod === 'transfer'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className={formData.paymentMethod === 'transfer' ? 'text-blue-500' : 'text-gray-400'} size={24} />
                            <h3 className="font-bold text-lg">계좌이체</h3>
                        </div>
                        <p className="text-sm text-gray-600 text-left">
                            입금 확인 후 승인됩니다
                        </p>
                    </button>
                </div>
            </section>

            {/* 약관 동의 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">약관 동의</h2>

                <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-1">
                            <input
                                type="checkbox"
                                checked={formData.agreeToTerms}
                                onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, agreeToRefund: e.target.checked }))}
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

            {/* 버튼 */}
            <div className="flex justify-between">
                <button
                    onClick={onPrev}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={20} />
                    이전 단계
                </button>

                <div className="flex gap-3">
                    {onSaveDraft && (
                        <button
                            onClick={onSaveDraft}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            임시저장
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={!isFormValid() || isSubmitting}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${isFormValid() && !isSubmitting
                            ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                처리 중...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                {isAdmin ? '바로 등록하기' : '승인 요청하기'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">
                    📌 {isAdmin ? '등록 절차 안내' : '승인 절차 안내'}
                </h3>
                {isAdmin ? (
                    <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2">
                            <span className="font-semibold text-blue-600">1.</span>
                            <span>등록 즉시 캠페인이 게시되며 리뷰어 모집이 시작됩니다.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-semibold text-blue-600">2.</span>
                            <span>결제는 등록과 동시에 진행됩니다.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-semibold text-blue-600">3.</span>
                            <span>대시보드에서 실시간으로 진행 상황을 확인할 수 있습니다.</span>
                        </li>
                    </ol>
                ) : (
                    <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2">
                            <span className="font-semibold text-blue-600">1.</span>
                            <span>승인 요청 후 관리자가 캠페인 내용을 검토합니다.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-semibold text-blue-600">2.</span>
                            <span>승인이 완료되면 결제가 진행되고 캠페인이 게시됩니다.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-semibold text-blue-600">3.</span>
                            <span>리뷰어 모집이 시작되며, 대시보드에서 진행 상황을 확인할 수 있습니다.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-semibold text-blue-600">4.</span>
                            <span>승인이 거부된 경우 수정 후 재신청할 수 있습니다.</span>
                        </li>
                    </ol>
                )}
            </div>
        </div>
    );
}
