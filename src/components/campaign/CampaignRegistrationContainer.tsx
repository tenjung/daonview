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
import { saveDraft, loadDraft } from '@/lib/draftUtils';
import { useCampaignStore } from '@/store/campaignStore';

export default function CampaignRegistrationContainer() {
    const { user, profile, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEdit = !!searchParams?.get('id');
    const containerRef = useRef<HTMLDivElement>(null);

    // Zustand Store
    const store = useCampaignStore();
    const { currentStep, currentCampaignId, isSubmitting } = store;

    const [nextTrigger, setNextTrigger] = useState(0);

    // --- 캠페인 데이터 로드 로직 ---
    const handleLoadCompleted = useCallback((campaign: any, silent = false) => {
        if (!campaign) return;
        store.initializeFromCampaign(campaign);
        if (!silent) toast.success('캠페인 데이터를 성공적으로 불러왔습니다.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [store]);

    // 초기 데이터 로딩 처리
    useEffect(() => {
        if (authLoading || !user) return;
        const campaignId = searchParams?.get('id');
        const draftId = searchParams?.get('draftId');

        const loadData = async () => {
            if (campaignId && currentCampaignId !== campaignId) {
                const { data } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
                if (data) handleLoadCompleted(data, true);
            } else if (draftId && currentCampaignId !== draftId) {
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
    }, [authLoading, user, searchParams, currentCampaignId, handleLoadCompleted]);

    // --- 액션 핸들러 ---
    const handleSaveDraft = async () => {
        if (!user) return;
        try {
            // 전역 스토어의 현재 상태를 기반으로 임시저장
            const draft = await saveDraft(user.id, {
                id: currentCampaignId || undefined,
                title: store.campaignTitle || store.productName || '제목 없음',
                campaignType: store.campaignType || 'VISIT',
                step1Data: {
                    campaignType: store.campaignType,
                    includeReview: store.includeReview,
                    includeNaver: store.includeNaver,
                    includeInstagram: store.includeInstagram,
                    productUrl: store.productUrl,
                    productUrlPrivate: store.productUrlPrivate,
                    productUrlIndividual: store.productUrlIndividual,
                    productName: store.productName,
                    campaignTitle: store.campaignTitle,
                    brandName: store.brandName,
                    brandId: store.brandId,
                    productOptions: store.productOptions,
                    productPrice: store.productPrice,
                    shippingCost: store.shippingCost,
                    isCouponRequired: store.isCouponRequired,
                    platform: store.platform,
                    category: store.category,
                    region: store.region,
                    subRegion: store.subRegion,
                    stores: store.stores,
                    contactPhone: store.contactPhone,
                    contactMethod: store.contactMethod,
                    advertiserWillContact: store.advertiserWillContact,
                    visitTime: store.visitTime,
                    visitTimeNegotiable: store.visitTimeNegotiable,
                    visitDays: store.visitDays,
                    visitNotes: store.visitNotes,
                    experienceDetails: store.experienceDetails,
                    officialPrice: store.officialPrice,
                    totalRecruitment: store.totalRecruitment,
                    rewardPerPerson: store.rewardPerPerson,
                    scheduleType: store.scheduleType,
                    recruitmentStartDate: store.recruitmentStartDate,
                    firstSelectionDate: store.firstSelectionDate,
                    reviewDeadline: store.reviewDeadline,
                    reviewDeadlineDays: store.reviewDeadlineDays,
                    optionConfig: store.optionConfig,
                },
                step2Data: {
                    campaignImages: store.campaignImages,
                    purchaseNotes: store.purchaseNotes,
                    reviewMissionContent: store.reviewMissionContent,
                    textLength: store.textLength,
                    photoCount: store.photoCount,
                    videoRequired: store.videoRequired,
                    missionGuide: store.missionGuide,
                    keywords: store.keywords,
                    prohibitedWords: store.prohibitedWords,
                    additionalNotes: store.additionalNotes,
                    blogMainKeywords: store.blogMainKeywords,
                    blogSubKeywords: store.blogSubKeywords,
                    blogTitleGuide: store.blogTitleGuide,
                    blogContentGuide: store.blogContentGuide,
                    blogMapRequired: store.blogMapRequired,
                    blogRequiredLinks: store.blogRequiredLinks,
                    instagramHashtags: store.instagramHashtags,
                    instagramAccountTag: store.instagramAccountTag,
                    instagramPhotoGuide: store.instagramPhotoGuide,
                    instagramReelsRequired: store.instagramReelsRequired,
                },
                currentStep: store.currentStep,
            });
            if (draft?.id) {
                store.setField('currentCampaignId', draft.id);
                toast.success('캠페인이 임시저장되었습니다.');
            }
        } catch (e) {
            toast.error('임시저장에 실패했습니다.');
        }
    };

    const handleFinalSubmit = async () => {
        if (!user) {
            toast.error('사용자 정보가 없습니다.');
            return;
        }

        store.setField('isSubmitting', true);

        try {
            // 플랫폼 매핑 (배송형은 복수 선택 가능하므로 주 플랫폼 결정)
            let mappedPlatform = store.platform || 'BLOG';
            if (store.campaignType === 'DELIVERY') {
                if (store.includeNaver) mappedPlatform = 'BLOG';
                else if (store.includeInstagram) mappedPlatform = 'INSTAGRAM';
                else if (store.includeReview) mappedPlatform = 'PURCHASE';
                else mappedPlatform = 'PURCHASE'; // 기본값
            }

            // 날짜 계산
            const now = new Date().toISOString().split('T')[0];
            const endDate = store.reviewDeadline || store.recruitmentStartDate || now;

            const step1Data = {
                campaignType: store.campaignType,
                includeReview: store.includeReview,
                includeNaver: store.includeNaver,
                includeInstagram: store.includeInstagram,
                productUrl: store.productUrl,
                productUrlPrivate: store.productUrlPrivate,
                productUrlIndividual: store.productUrlIndividual,
                productName: store.productName,
                campaignTitle: store.campaignTitle,
                brandName: store.brandName,
                brandId: store.brandId,
                productOptions: store.productOptions,
                productPrice: store.productPrice,
                shippingCost: store.shippingCost,
                isCouponRequired: store.isCouponRequired,
                platform: store.platform,
                category: store.category,
                region: store.region,
                subRegion: store.subRegion,
                stores: store.stores,
                contactPhone: store.contactPhone,
                contactMethod: store.contactMethod,
                advertiserWillContact: store.advertiserWillContact,
                visitTime: store.visitTime,
                visitTimeNegotiable: store.visitTimeNegotiable,
                visitDays: store.visitDays,
                visitNotes: store.visitNotes,
                experienceDetails: store.experienceDetails,
                officialPrice: store.officialPrice,
                totalRecruitment: store.totalRecruitment,
                rewardPerPerson: store.rewardPerPerson,
                scheduleType: store.scheduleType,
                recruitmentStartDate: store.recruitmentStartDate,
                firstSelectionDate: store.firstSelectionDate,
                reviewDeadline: store.reviewDeadline,
                reviewDeadlineDays: store.reviewDeadlineDays,
                optionConfig: store.optionConfig,
            };

            const step2Data = {
                campaignImages: store.campaignImages,
                purchaseNotes: store.purchaseNotes,
                reviewMissionContent: store.reviewMissionContent,
                textLength: store.textLength,
                photoCount: store.photoCount,
                videoRequired: store.videoRequired,
                missionGuide: store.missionGuide,
                keywords: store.keywords,
                prohibitedWords: store.prohibitedWords,
                additionalNotes: store.additionalNotes,
                blogMainKeywords: store.blogMainKeywords,
                blogSubKeywords: store.blogSubKeywords,
                blogTitleGuide: store.blogTitleGuide,
                blogContentGuide: store.blogContentGuide,
                blogMapRequired: store.blogMapRequired,
                blogRequiredLinks: store.blogRequiredLinks,
                instagramHashtags: store.instagramHashtags,
                instagramAccountTag: store.instagramAccountTag,
                instagramPhotoGuide: store.instagramPhotoGuide,
                instagramReelsRequired: store.instagramReelsRequired,
            };

            const step3Data = {
                paymentMethod: store.paymentMethod,
                agreeToTerms: store.agreeToTerms,
                agreeToRefund: store.agreeToRefund,
            };

            // 매장 데이터 정리 (클라이언트 사이드에서 좌표 처리가 완료되므로 서버 API 호출 제거)
            const updatedStores = store.stores || [];

            // 캠페인 데이터 구성
            const campaignData: any = {
                created_by: user.id,
                brand_id: store.brandId,
                brand_name: store.brandName,
                product_name: store.productName || '',
                title: store.campaignTitle,
                type: (store.campaignType || 'VISIT').toUpperCase(),
                platform: mappedPlatform.toUpperCase(),
                category: store.category,
                region: store.region,
                end_date: store.scheduleType === 'always' ? '9999-12-31' : endDate,
                is_always: store.scheduleType === 'always',
                total_recruitment: (store.totalRecruitment === '무제한' || store.totalRecruitment === '999')
                    ? 999999
                    : parseInt(store.totalRecruitment) || 0,
                recruit_count: (store.totalRecruitment === '무제한' || store.totalRecruitment === '999')
                    ? 999999
                    : parseInt(store.totalRecruitment) || 0,
                reward_per_person: Number(store.rewardPerPerson || 0),
                campaign_images: store.campaignImages || [],
                thumbnail_url: store.campaignImages?.[0] || null,
                experience_details: store.experienceDetails || null,
                product_options: store.productOptions || [],
                status: profile?.role === 'ADMIN' ? 'RECRUITING' : 'PENDING',
                // 새로운 store_locations 컬럼에 매장 좌표 정보 저장 (API 호출 최적화)
                store_locations: updatedStores.length > 0 ? updatedStores : null,
                campaign_options: {
                    step1Data,
                    step2Data,
                    step3Data,
                    currentStep: 3,
                    contact_phone: store.contactPhone,
                    contact_method: store.contactMethod,
                    official_price: store.officialPrice,
                    mission_guide: store.missionGuide,
                    keywords: store.keywords,
                    stores: updatedStores,
                    lastUpdated: new Date().toISOString()
                },
                contact_method: store.contactMethod,
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

                if (currentCampaignId && currentCampaignId !== result.id.toString()) {
                    const isDraftNumeric = !isNaN(Number(currentCampaignId));
                    if (isDraftNumeric) {
                        await supabase.from('campaigns').delete().eq('id', Number(currentCampaignId));
                    }
                }
                toast.success('캠페인이 성공적으로 등록되었습니다.');
            }

            // 스토어 초기화
            store.resetStore();

            setTimeout(() => {
                router.push(profile?.role === 'ADMIN' ? '/dashboard/admin/campaigns' : '/dashboard/advertiser');
            }, 1000);

        } catch (error: any) {
            console.error('Save Error:', error);
            toast.error(error.message || '저장 중 오류가 발생했습니다.');
        } finally {
            store.setField('isSubmitting', false);
        }
    };

    // --- 스텝 이동 로직 ---
    const goToStep = (step: number) => {
        store.setField('currentStep', step);
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
                            store.initializeFromCampaign({
                                ...draft,
                                id: draft.id,
                                campaign_options: {
                                    step1Data: draft.step1Data,
                                    step2Data: draft.step2Data,
                                    currentStep: draft.currentStep || 1
                                }
                            });
                            toast.success('임시저장된 캠페인을 불러왔습니다.');
                        }}
                        onLoadCompleted={handleLoadCompleted}
                    />
                )}

                <div className="mt-8 transition-all duration-500">
                    {currentStep === 1 && (
                        <CampaignStep1
                            onNext={() => goToStep(2)}
                            onSaveDraft={handleSaveDraft}
                            submitTrigger={nextTrigger}
                        />
                    )}
                    {currentStep === 2 && (
                        <CampaignStep2
                            onNext={() => isEdit ? handleFinalSubmit() : goToStep(3)}
                            onPrev={() => goToStep(1)}
                            onSaveDraft={handleSaveDraft}
                            isEdit={isEdit}
                            submitTrigger={nextTrigger}
                        />
                    )}
                    {currentStep === 3 && (
                        <CampaignStep3
                            onSubmit={handleFinalSubmit}
                            onPrev={() => goToStep(2)}
                            onSaveDraft={handleSaveDraft}
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
