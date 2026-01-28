'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import CampaignStep1 from '@/components/campaign/CampaignStep1';
import CampaignStep2 from '@/components/campaign/CampaignStep2';
import CampaignStep3 from '@/components/campaign/CampaignStep3';
import { CampaignActionButtons } from '@/components/campaign/CampaignActionButtons';
import FloatingActionWrapper from '@/components/campaign/FloatingActionWrapper';
import CampaignLoader from '@/components/campaign/CampaignLoader';
import { saveDraft, loadDraft, DraftCampaign } from '@/lib/draftUtils';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function CampaignRegistrationContainer() {
    const { user, profile, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEdit = !!searchParams?.get('id');
    const containerRef = useRef<HTMLDivElement>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [step1Data, setStep1Data] = useState<any>(null);
    const [step1Complete, setStep1Complete] = useState(false);
    const [step2Data, setStep2Data] = useState<any>(null);
    const [initialStep1Data, setInitialStep1Data] = useState<any>(null);
    const [initialStep2Data, setInitialStep2Data] = useState<any>(null);

    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nextTrigger, setNextTrigger] = useState(0); 
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    // --- 캠페인 데이터 로드 로직 (DB 개별 컬럼과 options 병합) ---
    const handleLoadCompleted = useCallback((campaign: any, silent = false) => {
        if (!campaign) return;

        const optionsRaw = campaign.campaign_options;
        const options = Array.isArray(optionsRaw) ? (optionsRaw[0] || {}) : (optionsRaw || {});
        const s1 = options.step1Data || {};
        const s2 = options.step2Data || {};

        // DB 개별 컬럼 필드를 우선 적용하여 Step1 데이터 정규화
        const finalStep1: any = {
            ...(s1 || {}),
            brandId: campaign.brand_id || s1.brandId || null,
            brandName: campaign.brand_name || s1.brandName || '',
            productName: campaign.product_name || s1.productName || '',
            campaignTitle: campaign.title || s1.campaignTitle || campaign.product_name || '',
            campaignType: (campaign.type || s1.campaignType || 'VISIT').toUpperCase(),
            platform: (campaign.platform || s1.platform || 'BLOG').toUpperCase(),
            category: campaign.category || s1.category || '',
            region: campaign.region || s1.region || '',
            totalRecruitment: (campaign.total_recruitment || campaign.recruit_count || s1.totalRecruitment || '0').toString(),
            rewardPerPerson: campaign.reward_per_person || s1.rewardPerPerson || 0,
            // 스키마에 따로 컬럼이 없는 필드들은 options 내부에서 복구
            contactPhone: options.contact_phone || s1.contactPhone || '',
            officialPrice: (options.official_price || s1.officialPrice || '').toString(),
            stores: options.stores || s1.stores || [],
            productOptions: campaign.product_options || s1.productOptions || [],
        };

        const finalStep2: any = {
            ...(s2 || {}),
            campaignTitle: campaign.title || s2.campaignTitle || finalStep1.campaignTitle,
            campaignImages: (Array.isArray(campaign.campaign_images) && campaign.campaign_images.length > 0)
                ? campaign.campaign_images
                : (Array.isArray(s2.campaignImages) ? s2.campaignImages : (campaign.thumbnail_url ? [campaign.thumbnail_url] : [])),
            missionGuide: options.mission_guide || s2.missionGuide || '',
            keywords: Array.isArray(campaign.keywords) ? campaign.keywords : (Array.isArray(s2.keywords) ? s2.keywords : []),
        };

        setCurrentDraftId(campaign.id.toString());
        setCurrentStep(options.currentStep || 1);
        setStep1Data(finalStep1);
        setInitialStep1Data(finalStep1);
        setStep2Data(finalStep2);
        setInitialStep2Data(finalStep2);
        setStep1Complete(options.currentStep > 1 || !!finalStep1.productName);

        if (!silent) toast.success('캠페인 데이터를 성공적으로 불러왔습니다.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // 초기 데이터 로딩 처리
    useEffect(() => {
        if (authLoading || !user) return;
        const campaignId = searchParams?.get('id');
        const draftId = searchParams?.get('draftId');

        const loadData = async () => {
            if (campaignId && currentDraftId !== campaignId) {
                const { data } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
                if (data) handleLoadCompleted(data, true);
            } else if (draftId && currentDraftId !== draftId) {
                const draft = await loadDraft(user.id, draftId);
                if (draft) {
                    const rawData = {
                        ...draft,
                        id: draft.id,
                        created_by: draft.userId,
                        campaign_options: {
                            step1Data: draft.step1Data,
                            step2Data: draft.step2Data,
                            currentStep: draft.currentStep,
                            contact_phone: draft.step1Data?.contactPhone,
                            official_price: draft.step1Data?.officialPrice,
                            mission_guide: draft.step2Data?.missionGuide,
                            keywords: draft.step2Data?.keywords,
                            stores: draft.step1Data?.stores,
                        }
                    };
                    handleLoadCompleted(rawData, true);
                }
            }
        };
        loadData();
    }, [authLoading, user, searchParams, currentDraftId, handleLoadCompleted]);

    // --- 액션 핸들러 ---
    const handleSaveDraft = async () => {
        if (!user || !step1Data) return;
        try {
            const draft = await saveDraft(user.id, {
                id: currentDraftId || undefined,
                title: step1Data.campaignTitle || step1Data.productName || '제목 없음',
                campaignType: step1Data.campaignType,
                step1Data,
                step2Data,
                currentStep,
            });
            if (draft?.id) {
                setCurrentDraftId(draft.id);
                toast.success('캠페인이 임시저장되었습니다.');
            }
        } catch (e) {
            toast.error('임시저장에 실패했습니다.');
        }
    };

    const handleFinalSubmit = async (step3Data: any, latestStep2Data?: any) => {
        if (!user || !step1Data) {
            toast.error('사용자 정보 또는 캠페인 데이터가 없습니다.');
            return;
        }

        setIsSubmitting(true);

        try {
            const finalStep2 = latestStep2Data || step2Data;

            // 플랫폼 매핑
            let mappedPlatform = step1Data.platform || 'BLOG';
            if (step1Data.campaignType === 'DELIVERY') {
                if (step1Data.includeNaver) mappedPlatform = 'BLOG';
                else if (step1Data.includeInstagram) mappedPlatform = 'INSTAGRAM';
                else if (step1Data.includeReview) mappedPlatform = 'PURCHASE';
            }

            // 날짜 계산
            const now = new Date().toISOString().split('T')[0];
            const endDate = step1Data.reviewDeadline || step1Data.recruitmentStartDate || now;

            // 캠페인 데이터 구성
            const campaignData: any = {
                created_by: user.id,
                brand_id: step1Data.brandId,
                brand_name: step1Data.brandName,
                product_name: step1Data.productName || '',
                title: finalStep2?.campaignTitle || step1Data.campaignTitle,
                type: (step1Data.campaignType || 'VISIT').toUpperCase(),
                platform: mappedPlatform.toUpperCase(),
                category: step1Data.category,
                region: step1Data.region,
                end_date: step1Data.scheduleType === 'always' ? '9999-12-31' : endDate,
                is_always: step1Data.scheduleType === 'always',
                total_recruitment: step1Data.totalRecruitment === '무제한'
                    ? 999999
                    : parseInt(step1Data.totalRecruitment) || 0,
                recruit_count: step1Data.totalRecruitment === '무제한'
                    ? 999999
                    : parseInt(step1Data.totalRecruitment) || 0,
                reward_per_person: Number(step1Data.rewardPerPerson || 0),
                campaign_images: finalStep2?.campaignImages || [],
                thumbnail_url: finalStep2?.campaignImages?.[0] || null,
                experience_details: step1Data.experienceDetails || null,
                product_options: step1Data.productOptions || [],
                status: profile?.role === 'ADMIN' ? 'RECRUITING' : 'PENDING',
                campaign_options: {
                    step1Data,
                    step2Data: finalStep2,
                    step3Data,
                    currentStep: 3,
                    contact_phone: step1Data.contactPhone,
                    official_price: step1Data.officialPrice,
                    mission_guide: finalStep2?.missionGuide,
                    keywords: finalStep2?.keywords,
                    stores: step1Data.stores,
                    lastUpdated: new Date().toISOString()
                },
            };

            const campaignId = searchParams?.get('id');
            let result;

            if (campaignId && !isNaN(Number(campaignId))) {
                const { data, error } = await supabase
                    .from('campaigns')
                    .update(campaignData)
                    .eq('id', Number(campaignId))
                    .select()
                    .single();

                if (error) throw error;
                result = data;
                toast.success('캠페인이 성공적으로 수정되었습니다.');
            } else {
                const { data, error } = await supabase
                    .from('campaigns')
                    .insert([campaignData])
                    .select()
                    .single();

                if (error) throw error;
                result = data;

                if (currentDraftId && currentDraftId !== result.id.toString()) {
                    // draftId가 숫자인 경우와 문자열인 경우 대응
                    const isDraftNumeric = !isNaN(Number(currentDraftId));
                    if (isDraftNumeric) {
                        await supabase.from('campaigns').delete().eq('id', Number(currentDraftId));
                    }
                }
                toast.success('캠페인이 성공적으로 등록되었습니다.');
            }

            setTimeout(() => {
                router.push(profile?.role === 'ADMIN' ? '/dashboard/admin/campaigns' : '/dashboard/advertiser');
            }, 1000);

        } catch (error: any) {
            console.error('Save Error:', error);
            toast.error(error.message || '저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 스텝 이동 로직 ---
    const goToStep = (step: number) => {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- 버튼 상태 계산 ---
    const getNextLabel = () => {
        if (currentStep === 1) return "다음 단계로";
        if (currentStep === 2) return isEdit ? "수정 완료" : "다음 단계";
        return profile?.role === 'ADMIN' ? "바로 등록" : "승인 요청";
    };

    return (
        <div ref={containerRef} className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 py-8 relative min-h-screen">
            <div className="max-w-4xl mx-auto px-6">
                {/* 헤더 및 스텝 내비게이션 */}
                <header className="mb-10 pt-4">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {isEdit ? '캠페인 정보 수정' : '새 캠페인 등록'}
                        </h1>
                    </div>

                    <nav className="relative flex justify-between max-w-md mx-auto mb-12">
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0" />
                        {[1, 2, 3].map((step) => (
                            <div 
                                key={step} 
                                className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                                onClick={() => goToStep(step)}
                            >
                                <div 
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 transform group-hover:scale-110
                                        ${currentStep === step 
                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 ring-4 ring-rose-50' 
                                            : currentStep > step
                                                ? 'bg-rose-500 text-white shadow-md'
                                                : 'bg-white text-slate-400 border-2 border-slate-200 group-hover:border-rose-300 group-hover:text-rose-400'}
                                    `}
                                >
                                    {step}
                                </div>
                                <span className={`text-xs font-bold transition-colors duration-300 ${currentStep === step ? 'text-rose-600 scale-105' : 'text-slate-400 group-hover:text-rose-400'}`}>
                                    {step === 1 ? '기본 정보' : step === 2 ? '상세 설정' : '등록 확인'}
                                </span>
                            </div>
                        ))}
                    </nav>
                </header>

                {!authLoading && user && (
                    <CampaignLoader
                        userId={user.id}
                        onLoadDraft={(draft) => {
                            setCurrentDraftId(draft.id);
                            setCurrentStep(draft.currentStep);
                            setStep1Data(draft.step1Data);
                            setStep2Data(draft.step2Data);
                        }}
                        onLoadCompleted={handleLoadCompleted}
                    />
                )}

                <div className="mt-8 transition-all duration-500">
                    {currentStep === 1 && (
                        <CampaignStep1
                            onNext={(data) => {
                                setStep1Data(data);
                                setStep1Complete(true);
                                goToStep(2);
                            }}
                            onChange={setStep1Data}
                            onSaveDraft={handleSaveDraft}
                            initialData={initialStep1Data}
                            submitTrigger={nextTrigger}
                        />
                    )}
                    {currentStep === 2 && (
                        <CampaignStep2
                            onNext={(data) => {
                                setStep2Data(data);
                                if (isEdit) handleFinalSubmit(null, data);
                                else goToStep(3);
                            }}
                            onPrev={() => goToStep(1)}
                            onSaveDraft={handleSaveDraft}
                            onChange={setStep2Data}
                            initialData={initialStep2Data}
                            step1Data={step1Data}
                            isEdit={isEdit}
                            submitTrigger={nextTrigger}
                        />
                    )}
                    {currentStep === 3 && (
                        <CampaignStep3
                            onSubmit={handleFinalSubmit}
                            onPrev={() => goToStep(2)}
                            onSaveDraft={handleSaveDraft}
                            step1Data={step1Data}
                            step2Data={step2Data}
                            submitTrigger={nextTrigger}
                        />
                    )}
                </div>

                <FloatingActionWrapper>
                    <CampaignActionButtons
                        onPrev={currentStep > 1 ? () => goToStep(currentStep - 1) : undefined}
                        onNext={() => setNextTrigger(t => t + 1)}
                        onSaveDraft={handleSaveDraft}
                        nextLabel={getNextLabel()}
                        isSubmitting={isSubmitting}
                        showCheckIcon={isEdit || currentStep === 3}
                    />
                </FloatingActionWrapper>
            </div>
        </div>
    );
}
