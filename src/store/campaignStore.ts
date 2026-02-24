import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveCampaignPlatformState } from '@/lib/campaignUtils';

// --- Types ---

export interface ProductOption {
    id: string;
    optionName: string;
    optionPrice: string;
    recruitmentCount: string;
}

export interface Store {
    id: string;
    naverPlaceUrl: string;
    storeName: string;
    address: string;
    lat?: number;
    lng?: number;
}

export interface CampaignState {
    // Step 1: 기본 정보
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS' | null;
    includeReview: boolean;
    includeNaver: boolean;
    includeInstagram: boolean;
    productUrl: string;
    productUrlPrivate: boolean;
    productUrlIndividual: boolean;
    productName: string;
    campaignTitle: string;
    brandName: string;
    brandId: string | null;
    productOptions: ProductOption[];
    productPrice: string;
    shippingCost: string;
    isCouponRequired: boolean;
    platform: 'BLOG' | 'INSTAGRAM' | 'PURCHASE' | null;
    category: string;
    region: string;
    subRegion: string;
    stores: Store[];
    contactPhone: string;
    contactMethod: 'TEXT_ONLY' | 'CALL_ONLY' | 'BOTH';
    advertiserWillContact: boolean;
    visitTime: string;
    visitTimeNegotiable: boolean;
    visitDays: string[];
    visitNotes: string;
    experienceDetails: string;
    officialPrice: string;
    totalRecruitment: string;

    scheduleType: 'recommended' | 'custom' | 'always';
    recruitmentStartDate: string;
    firstSelectionDate: string;
    reviewDeadline: string;
    reviewDeadlineDays: string;
    optionConfig: {
        mode: 'SINGLE' | 'RANKED' | 'MULTI';
        maxSelect: number;
    };

    // Step 2: 상세 설정
    campaignImages: string[];
    purchaseNotes: string;
    reviewMissionContent: string;
    textLength: 'free' | 'short' | 'medium' | 'long' | 'custom';
    photoCount: '1' | '3' | '5' | 'none';
    videoRequired: 'yes' | 'no';
    missionGuide: string;
    keywords: string[];
    prohibitedWords: string[];
    additionalNotes: string;
    blogMainKeywords: string[];
    blogSubKeywords: string[];
    blogTitleGuide: string;
    blogContentGuide: string;
    blogMapRequired: boolean;
    blogRequiredLinks: string[];
    instagramHashtags: string[];
    instagramAccountTag: string;
    instagramPhotoGuide: string;
    instagramReelsRequired: boolean;

    // Step 3: 등록 확인
    paymentMethod: 'card' | 'transfer' | 'free' | null;
    depositorName: string;
    promotionType: 'COUPON' | 'EXTERNAL' | 'UNLIMITED' | null;
    couponCode: string;
    externalOrderNumber: string;
    agreeToTerms: boolean;


    // Orchestration
    currentStep: number;
    isEdit: boolean;
    currentCampaignId: string | null;
    isSubmitting: boolean;
}

interface CampaignStore extends CampaignState {
    // Actions
    setField: <K extends keyof CampaignState>(field: K, value: CampaignState[K]) => void;
    updateFields: (fields: Partial<CampaignState>) => void;
    resetStore: () => void;
    initializeFromCampaign: (campaign: any) => void;
}

// --- Initial State ---

const initialState: CampaignState = {
    campaignType: 'VISIT',
    includeReview: false,
    includeNaver: false,
    includeInstagram: false,
    productUrl: '',
    productUrlPrivate: false,
    productUrlIndividual: false,
    productName: '',
    campaignTitle: '',
    brandName: '',
    brandId: null,
    productOptions: [],
    productPrice: '0',
    shippingCost: '0',
    isCouponRequired: false,
    platform: 'BLOG',
    category: '',
    region: '',
    subRegion: '',
    stores: [],
    contactPhone: '',
    contactMethod: 'TEXT_ONLY',
    advertiserWillContact: false,
    visitTime: '',
    visitTimeNegotiable: false,
    visitDays: [],
    visitNotes: '',
    experienceDetails: '',
    officialPrice: '0',
    totalRecruitment: '0',

    scheduleType: 'recommended',
    recruitmentStartDate: '',
    firstSelectionDate: '',
    reviewDeadline: '',
    reviewDeadlineDays: '7',
    optionConfig: {
        mode: 'SINGLE',
        maxSelect: 1,
    },
    campaignImages: [],
    purchaseNotes: '',
    reviewMissionContent: '',
    textLength: 'free',
    photoCount: '3',
    videoRequired: 'no',
    missionGuide: '',
    keywords: [],
    prohibitedWords: [],
    additionalNotes: '',
    blogMainKeywords: [],
    blogSubKeywords: [],
    blogTitleGuide: '노출 잘되는 제목 필수 키워드를 하나 선택하여 자연스럽게 조합해주세요',
    blogContentGuide: '',
    blogMapRequired: true,
    blogRequiredLinks: [],
    instagramHashtags: [],
    instagramAccountTag: '',
    instagramPhotoGuide: '',
    instagramReelsRequired: false,
    paymentMethod: null,
    depositorName: '',
    promotionType: null,
    couponCode: '',
    externalOrderNumber: '',
    agreeToTerms: false,

    currentStep: 1,
    isEdit: false,
    currentCampaignId: null,
    isSubmitting: false,
};

// --- Store ---

export const useCampaignStore = create<CampaignStore>()(
    persist(
        (set) => ({
            ...initialState,

            setField: (field, value) => set((state) => ({ ...state, [field]: value })),

            updateFields: (fields) => set((state) => ({ ...state, ...fields })),

            resetStore: () => set(initialState),

            initializeFromCampaign: (campaign: any) => {
                const optionsRaw = campaign.campaign_options;
                const options = Array.isArray(optionsRaw) ? (optionsRaw[0] || {}) : (optionsRaw || {});
                const s1 = options.step1Data || {};
                const s2 = options.step2Data || {};
                const s3 = options.step3Data || {};
                const resolvedPlatformState = resolveCampaignPlatformState({
                    type: campaign.type,
                    platform: campaign.platform,
                    step1Data: s1,
                });
                const normalizedCampaignType = resolvedPlatformState.normalizedType === 'DELIVERY'
                    ? 'DELIVERY'
                    : resolvedPlatformState.normalizedType === 'PRESS'
                        ? 'PRESS'
                        : 'VISIT';
                const defaultPlatformByType = normalizedCampaignType === 'DELIVERY' ? 'PURCHASE' : 'BLOG';
                const normalizedPlatform = resolvedPlatformState.resolvedPlatform === 'INSTAGRAM'
                    ? 'INSTAGRAM'
                    : resolvedPlatformState.resolvedPlatform === 'PURCHASE'
                        ? 'PURCHASE'
                        : resolvedPlatformState.resolvedPlatform === 'BLOG'
                            ? 'BLOG'
                            : defaultPlatformByType;

                set({
                    // Basic Metadata
                    currentCampaignId: campaign.id?.toString() || null,
                    currentStep: options.currentStep || 1,
                    isEdit: true,

                    // Step 1 normalization
                    campaignType: normalizedCampaignType,
                    brandId: campaign.brand_id || s1.brandId || null,
                    brandName: campaign.brand_name || s1.brandName || '',
                    productName: campaign.product_name || s1.productName || '',
                    campaignTitle: campaign.title || s1.campaignTitle || campaign.product_name || '',
                    platform: normalizedPlatform,
                    category: campaign.category || s1.category || '',
                    region: campaign.region || s1.region || '',
                    subRegion: s1.subRegion || '',
                    totalRecruitment: (campaign.total_recruitment ?? campaign.recruit_count ?? s1.totalRecruitment ?? '0').toString(),


                    includeReview: resolvedPlatformState.includeReview,
                    includeNaver: resolvedPlatformState.includeNaver,
                    includeInstagram: resolvedPlatformState.includeInstagram,
                    productUrl: campaign.product_url || s1.productUrl || '',
                    productUrlPrivate: s1.productUrlPrivate || false,
                    productUrlIndividual: s1.productUrlIndividual || false,
                    productOptions: campaign.product_options || s1.productOptions || [],
                    productPrice: (s1.productPrice || '0').toString(),
                    shippingCost: (s1.shippingCost || '0').toString(),
                    isCouponRequired: s1.isCouponRequired || false,
                    contactPhone: options.contact_phone || s1.contactPhone || '',
                    contactMethod: campaign.contact_method || options.contact_method || s1.contactMethod || 'TEXT_ONLY',
                    advertiserWillContact: s1.advertiserWillContact || false,
                    visitTime: s1.visitTime || '',
                    visitTimeNegotiable: s1.visitTimeNegotiable || false,
                    visitDays: Array.isArray(s1.visitDays) ? s1.visitDays : [],
                    visitNotes: s1.visitNotes || '',
                    experienceDetails: campaign.experience_details || s1.experienceDetails || '',
                    officialPrice: (options.official_price || s1.officialPrice || '').toString(),
                    scheduleType: s1.scheduleType || 'recommended',
                    recruitmentStartDate: s1.recruitmentStartDate || '',
                    firstSelectionDate: s1.firstSelectionDate || '',
                    reviewDeadline: campaign.end_date || s1.reviewDeadline || '',
                    reviewDeadlineDays: s1.reviewDeadlineDays || '7',
                    optionConfig: s1.optionConfig || { mode: 'SINGLE', maxSelect: 1 },
                    stores: options.stores || s1.stores || [],

                    // Step 2 normalization
                    campaignImages: (Array.isArray(campaign.campaign_images) && campaign.campaign_images.length > 0)
                        ? campaign.campaign_images
                        : (Array.isArray(s2.campaignImages) ? s2.campaignImages : (campaign.thumbnail_url ? [campaign.thumbnail_url] : [])),
                    purchaseNotes: s2.purchaseNotes || '',
                    reviewMissionContent: s2.reviewMissionContent || '',
                    textLength: s2.textLength || 'free',
                    photoCount: s2.photoCount || '3',
                    videoRequired: s2.videoRequired || 'no',
                    missionGuide: options.mission_guide || s2.missionGuide || '',
                    keywords: Array.isArray(campaign.keywords) ? campaign.keywords : (Array.isArray(s2.keywords) ? s2.keywords : []),
                    prohibitedWords: s2.prohibitedWords || [],
                    additionalNotes: s2.additionalNotes || '',
                    blogMainKeywords: Array.isArray(s2.blogMainKeywords) ? s2.blogMainKeywords : (s2.blogMainKeyword ? [s2.blogMainKeyword] : []),
                    blogSubKeywords: s2.blogSubKeywords || [],
                    blogTitleGuide: s2.blogTitleGuide || '노출 잘되는 제목 필수 키워드를 하나 선택하여 자연스럽게 조합해주세요',
                    blogContentGuide: s2.blogContentGuide || '',
                    blogMapRequired: s2.blogMapRequired ?? true,
                    blogRequiredLinks: s2.blogRequiredLinks || [],
                    instagramHashtags: s2.instagramHashtags || [],
                    instagramAccountTag: s2.instagramAccountTag || '',
                    instagramPhotoGuide: s2.instagramPhotoGuide || '',
                    instagramReelsRequired: s2.instagramReelsRequired || false,

                    // Step 3 normalization
                    paymentMethod: s3.paymentMethod || null,
                    depositorName: s3.depositorName || '',
                    promotionType: s3.promotionType || null,
                    couponCode: s3.couponCode || '',
                    externalOrderNumber: s3.externalOrderNumber || '',
                    agreeToTerms: s3.agreeToTerms || false,

                });
            }
        }),
        {
            name: 'campaign-creation-store', // 로컬 스토리지 키
            partialize: (state) => ({
                // 새로고침 시 유지할 데이터 필터링 (필요 시)
                ...state
            }),
        }
    )
);
