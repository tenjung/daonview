'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import CampaignStep1 from '@/components/campaign/CampaignStep1';
import CampaignStep2 from '@/components/campaign/CampaignStep2';
import CampaignStep3 from '@/components/campaign/CampaignStep3';
import { CampaignActionButtons } from '@/components/campaign/CampaignActionButtons';
import FloatingActionWrapper from '@/components/campaign/FloatingActionWrapper';
import CampaignLoader from '@/components/campaign/CampaignLoader';
import CampaignSuccess from '@/components/campaign/CampaignSuccess';
import { saveDraft, loadDraft } from '@/lib/draftUtils';
import { useCampaignStore } from '@/store/campaignStore';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';

export default function CampaignRegistrationContainer() {
    const { user, profile, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignIdParam = searchParams?.get('id');
    const draftIdParam = searchParams?.get('draftId');
    const roleFromAuth = profile?.role || user?.user_metadata?.role;
    const isEdit = !!campaignIdParam;
    const containerRef = useRef<HTMLDivElement>(null);

    // Zustand Store
    const store = useCampaignStore();
    const initializeFromCampaign = useCampaignStore((state) => state.initializeFromCampaign);
    const resetStore = useCampaignStore((state) => state.resetStore);
    const { currentStep, currentCampaignId, isSubmitting } = store;

    const [nextTrigger, setNextTrigger] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [isInitialDataReady, setIsInitialDataReady] = useState(!campaignIdParam && !draftIdParam);
    const deniedRef = useRef(false);
    const hasFetchedRef = useRef(false);

    // --- 캠페인 데이터 로드 로직 ---

    // 새 캠페인 등록 진입 시 스토어 초기화 (localStorage 에 이전 데이터가 남아있어 오기입 방지)
    useEffect(() => {
        if (!campaignIdParam && !draftIdParam) {
            resetStore();
            setIsInitialDataReady(true);
        }
    }, [campaignIdParam, draftIdParam, resetStore]);

    // URL 파라미터가 바뀌면 로드 가드 초기화
    useEffect(() => {
        hasFetchedRef.current = false;
        deniedRef.current = false;
    }, [campaignIdParam, draftIdParam]);

    useEffect(() => {
        if (!authLoading && user && profile?.role === 'ADVERTISER' && profile?.biz_verification_status !== 'APPROVED') {
            toast.error('캠페인을 등록하려면 사업자 인증이 필요합니다.');
            router.push('/dashboard/advertiser/verification');
        }
    }, [authLoading, user, profile, router]);

    const handleLoadCompleted = useCallback((campaign: any, silent = false) => {
        if (!campaign) return;
        initializeFromCampaign(campaign);
        if (!silent) toast.success('캠페인 데이터를 성공적으로 불러왔습니다.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [initializeFromCampaign]);

    // edit 모드: 인증/권한 확인 후 URL id 기준으로 DB 단일 조회
    useEffect(() => {
        if (!campaignIdParam) return;
        if (authLoading) return;
        if (hasFetchedRef.current) return;

        if (!user?.id) {
            setIsInitialDataReady(true);
            if (!deniedRef.current) {
                toast.error('로그인이 필요합니다.');
                deniedRef.current = true;
            }
            router.push('/login');
            return;
        }

        let cancelled = false;
        setIsInitialDataReady(false);

        const fetchEditableCampaign = async (numericCampaignId: number) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            try {
                const response = await fetch(`/api/campaigns/${numericCampaignId}/editable`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal,
                });

                const payload = await response.json().catch(() => ({} as Record<string, unknown>));
                if (!response.ok) {
                    const message = typeof payload.error === 'string' ? payload.error : '캠페인 데이터를 불러오지 못했습니다.';
                    throw new Error(message);
                }

                return payload.data ?? null;
            } finally {
                clearTimeout(timeoutId);
            }
        };

        const loadCampaignById = async () => {
            try {
                const numericCampaignId = Number(campaignIdParam);
                if (Number.isNaN(numericCampaignId)) {
                    toast.error('잘못된 캠페인 ID입니다.');
                    return;
                }

                const data = await fetchEditableCampaign(numericCampaignId);

                if (cancelled) return;
                if (!data) {
                    toast.error('캠페인 데이터를 불러오지 못했습니다.');
                    return;
                }

                handleLoadCompleted(data, true);
                if (!cancelled) hasFetchedRef.current = true;
            } catch (error) {
                if (!cancelled) {
                    const normalizedError = error instanceof Error ? error.message : '';
                    const message = normalizedError === 'The operation was aborted.'
                        ? '캠페인 조회가 지연되고 있습니다. 새로고침 후 다시 시도해주세요.'
                        : normalizedError || '캠페인 데이터를 불러오는 중 오류가 발생했습니다.';
                    toast.error(message);
                }
            } finally {
                if (!cancelled) setIsInitialDataReady(true);
            }
        };

        loadCampaignById();

        return () => {
            cancelled = true;
        };
    }, [campaignIdParam, authLoading, user?.id, roleFromAuth, handleLoadCompleted, router]);

    // draft 모드: 인증이 준비된 뒤 사용자 draft 로딩
    useEffect(() => {
        if (campaignIdParam || !draftIdParam) return;
        if (authLoading) return;
        if (!user?.id) {
            setIsInitialDataReady(true);
            return;
        }
        if (hasFetchedRef.current) return;

        let cancelled = false;
        setIsInitialDataReady(false);

        const loadDraftData = async () => {
            try {
                const draft = await loadDraft(user.id, draftIdParam);
                if (cancelled) return;

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
                    if (!cancelled) hasFetchedRef.current = true;
                }
            } catch (_error) {
                if (!cancelled) toast.error('임시저장 데이터를 불러오는 중 오류가 발생했습니다.');
            } finally {
                if (!cancelled) setIsInitialDataReady(true);
            }
        };

        loadDraftData();

        return () => {
            cancelled = true;
        };
    }, [campaignIdParam, draftIdParam, authLoading, user?.id, handleLoadCompleted]);

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
            const normalizedCampaignType = (store.campaignType || 'VISIT').toUpperCase() as 'DELIVERY' | 'VISIT' | 'PRESS';
            const normalizedRole = normalizeRoleValue(roleFromAuth);
            const isAdmin = isAdminRole(normalizedRole);
            let normalizedIncludeReview = normalizedCampaignType === 'DELIVERY' ? Boolean(store.includeReview) : false;
            let normalizedIncludeNaver = normalizedCampaignType === 'DELIVERY'
                ? Boolean(store.includeNaver)
                : (String(store.platform || '').toUpperCase() === 'BLOG');
            let normalizedIncludeInstagram = normalizedCampaignType === 'DELIVERY'
                ? Boolean(store.includeInstagram)
                : (String(store.platform || '').toUpperCase() === 'INSTAGRAM');

            if (normalizedCampaignType === 'DELIVERY' && !normalizedIncludeReview && !normalizedIncludeNaver && !normalizedIncludeInstagram) {
                const fallbackPlatform = String(store.platform || 'PURCHASE').toUpperCase();
                normalizedIncludeReview = fallbackPlatform === 'PURCHASE';
                normalizedIncludeNaver = fallbackPlatform === 'BLOG';
                normalizedIncludeInstagram = fallbackPlatform === 'INSTAGRAM';
            }

            // 플랫폼 매핑 (배송형은 복수 선택 가능하므로 주 플랫폼 결정)
            let mappedPlatform = (store.platform || (normalizedCampaignType === 'DELIVERY' ? 'PURCHASE' : 'BLOG')).toUpperCase();
            if (normalizedCampaignType === 'DELIVERY') {
                if (normalizedIncludeNaver) mappedPlatform = 'BLOG';
                else if (normalizedIncludeInstagram) mappedPlatform = 'INSTAGRAM';
                else mappedPlatform = 'PURCHASE';
            }

            // 날짜 계산
            const now = new Date().toISOString().split('T')[0];
            const endDate = store.reviewDeadline || store.recruitmentStartDate || now;

            const calculateCosts = () => {
                const recruitmentCount = (store.totalRecruitment === '무제한' || store.totalRecruitment === '999') 
                    ? 0 
                    : (parseInt(store.totalRecruitment) || 0);

                let reviewCostPerPerson = 0;
                if (normalizedCampaignType === 'DELIVERY') {
                    if (normalizedIncludeReview) reviewCostPerPerson += 3000;
                    if (normalizedIncludeNaver) reviewCostPerPerson += 5000;
                    if (normalizedIncludeInstagram) reviewCostPerPerson += 5000;
                } else {
                    reviewCostPerPerson = 10000;
                }

                const totalReviewCost = recruitmentCount * reviewCostPerPerson;
                
                let productPayment = 0;
                const baseProductPrice = parseInt(store.productPrice?.replace(/,/g, '') || '0') || 0;
                
                if (normalizedCampaignType === 'DELIVERY' && (normalizedIncludeReview || mappedPlatform === 'PURCHASE')) {
                    if (store.purchaseRewardMethod === 'DAONVIEW') {
                        const priceWithFee = Math.round(baseProductPrice * 1.1);
                        productPayment = priceWithFee * recruitmentCount;
                    } else {
                        productPayment = 0;
                    }
                } else {
                    productPayment = baseProductPrice * recruitmentCount;
                }

                const subtotal = totalReviewCost + productPayment;
                const vat = Math.floor(subtotal * 0.1);
                const totalCost = subtotal + vat;

                return { totalCost };
            };

            const costs = calculateCosts();
            const normalizedPaymentMethod = String(store.paymentMethod || '').toUpperCase();

            const step1Data = {
                campaignType: normalizedCampaignType,
                includeReview: normalizedIncludeReview,
                includeNaver: normalizedIncludeNaver,
                includeInstagram: normalizedIncludeInstagram,
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
                purchaseRewardMethod: store.purchaseRewardMethod,
                platform: mappedPlatform,
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
                depositorName: store.depositorName,
                promotionType: store.promotionType,
                couponCode: store.couponCode,
                externalOrderNumber: store.externalOrderNumber,
                agreeToTerms: store.agreeToTerms,

            };

            // 매장 데이터 정리 (클라이언트 사이드에서 좌표 처리가 완료되므로 서버 API 호출 제거)
            const updatedStores = store.stores || [];

            // 캠페인 데이터 구성
            // 중요: created_by는 "생성(insert)" 시점에만 설정하고, "수정(update)" 시에는 절대 변경하지 않는다.
            const campaignDataBase = {
                brand_id: store.brandId,
                brand_name: store.brandName,
                product_name: store.productName || '',
                title: store.campaignTitle,
                type: normalizedCampaignType,
                platform: mappedPlatform.toUpperCase(),
                category: store.category,
                region: store.region,
                sub_region: store.subRegion,
                end_date: store.scheduleType === 'always' ? '9999-12-31' : endDate,
                is_always: store.scheduleType === 'always',
                total_recruitment: (store.totalRecruitment === '무제한' || store.totalRecruitment === '999')
                    ? 999999
                    : parseInt(store.totalRecruitment) || 0,
                recruit_count: (store.totalRecruitment === '무제한' || store.totalRecruitment === '999')
                    ? 999999
                    : parseInt(store.totalRecruitment) || 0,

                campaign_images: store.campaignImages || [],
                thumbnail_url: store.campaignImages?.[0] || null,
                experience_details: store.experienceDetails || null,
                product_options: store.productOptions || [],
                status: isAdmin ? 'RECRUITING' : 'PENDING',
                // 새로운 store_locations 컬럼에 매장 좌표 정보 저장 (API 호출 최적화)
                store_locations: updatedStores.length > 0 ? updatedStores : null,
                option_config: store.optionConfig || { mode: 'SINGLE', maxSelect: 1 },
                campaign_options: {
                    step1Data,
                    step2Data,
                    step3Data,
                    currentStep: 3,
                    payment_method: store.paymentMethod,
                    promotion_type: store.promotionType,
                    coupon_code: store.couponCode,
                    external_order_number: store.externalOrderNumber,
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
            const campaignDataForInsert = {
                ...campaignDataBase,
                created_by: user.id,
            };

            const campaignId = searchParams?.get('id');
            let result;

            if (campaignId && !isNaN(Number(campaignId))) {
                const { status: _status, ...updateData } = campaignDataBase;
                // 수정 시 상태/소유자는 기존 값을 유지 (신규 등록시에만 결정)

                let query = supabase
                    .from('campaigns')
                    .update(updateData)
                    .eq('id', Number(campaignId));

                if (!isAdmin) {
                    query = query.eq('created_by', user.id);
                }

                const { data, error } = await query.select().single();

                if (error) throw error;
                result = data;
                toast.success('수정완료되었습니다.');
                router.push(`/campaigns/${result.id}`);
                return;
            } else {
                const { data, error } = await supabase
                    .from('campaigns')
                    .insert([campaignDataForInsert])
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

                // PG 결제(CARD/TRANSFER) 검증 콜백에서 campaign_id가 비어온 경우 최신 결제건에 캠페인 매핑
                if (normalizedPaymentMethod === 'CARD' || normalizedPaymentMethod === 'TRANSFER') {
                    const { data: latestPgPayment } = await supabase
                        .from('payments')
                        .select('id')
                        .eq('user_id', user.id)
                        .is('campaign_id', null)
                        .eq('method', normalizedPaymentMethod)
                        .eq('status', 'PAID')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (latestPgPayment?.id) {
                        await supabase
                            .from('payments')
                            .update({ campaign_id: result.id, updated_at: new Date().toISOString() })
                            .eq('id', latestPgPayment.id);
                    }
                }

                toast.success('캠페인이 성공적으로 등록되었습니다.');
            }

            // [추가] 쿠폰 사용 처리
            if (store.paymentMethod === 'free' && store.promotionType === 'COUPON' && store.couponCode) {
                await supabase
                    .from('coupons')
                    .update({
                        status: 'USED',
                        used_at: new Date().toISOString(),
                        used_by: user.id,
                        campaign_id: result.id
                    })
                    .eq('code', store.couponCode);
            }

            // 스토어 초기화
            store.resetStore();

            // 성공 상태로 전환
            setLastResult(result);
            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

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

                {!authLoading && user && !isEdit && (
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
                    {!isInitialDataReady ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="text-sm font-semibold text-slate-500">캠페인 데이터를 불러오는 중...</div>
                        </div>
                    ) : isSuccess ? (
                        <CampaignSuccess
                            campaignTitle={lastResult?.title || store.campaignTitle || '제목 없음'}
                            brandName={lastResult?.brand_name || store.brandName || '브랜드 없음'}
                            totalAmount={lastResult?.campaign_options?.step1Data?.productPrice 
                                ? Number(lastResult.campaign_options.step1Data.productPrice.replace(/,/g, '')) 
                                : 0} // 실제 기획에 따라 totalCost 또는 subtotal 등 표시 가능
                            paymentMethod={lastResult?.campaign_options?.payment_method || store.paymentMethod}
                            isAdmin={profile?.role === 'ADMIN'}
                            isEdit={isEdit}
                            campaignId={lastResult?.id ?? (campaignIdParam ? Number(campaignIdParam) : null)}
                        />
                    ) : (
                        <>
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
                        </>
                    )}
                </div>

                {!isSuccess && isInitialDataReady && (
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
                )}
            </div>
        </div>
    );
}
