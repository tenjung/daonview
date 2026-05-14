// 임시저장 캠페인 관리 유틸리티

import { supabase } from './supabase/client';
import { buildCampaignStep1Snapshot, deriveCampaignHydrationState, normalizeCampaignType, resolveCampaignImageVariants } from './campaignUtils';

export interface DraftCampaign {
    id: string;
    userId: string;
    title: string;
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS';
    step1Data: any;
    step2Data?: any;
    currentStep: number;
    createdAt: string;
    updatedAt: string;
}

interface DraftCampaignInput {
    id?: string;
    title: string;
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS';
    step1Data: Record<string, any>;
    step2Data?: Record<string, any>;
    currentStep: number;
}

// 사용자별 임시저장 목록 가져오기
export const getUserDrafts = async (userId: string): Promise<DraftCampaign[]> => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('created_by', userId)
            .eq('status', 'DRAFT')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(normalizeDraftFromDB);
    } catch (error) {
        console.error('임시저장 목록 불러오기 실패:', error);
        return [];
    }
};

// 임시저장 추가/업데이트
export const saveDraft = async (userId: string, campaignData: DraftCampaignInput): Promise<DraftCampaign> => {
    try {
        // 1. 프로필 존재 여부 확인 (외래 키 제약 조건 체크)
        console.log('[saveDraft] 프로필 확인 중...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            console.error('프로필 확인 실패:', profileError);
            throw new Error('프로필 정보가 없습니다. DB의 profiles 테이블에 사용자 정보를 등록해야 합니다.');
        }

        const { canonical, step1Data: normalizedStep1Data } = buildCampaignStep1Snapshot(campaignData.step1Data);

        // 4. campaign_options 구조 (단일 객체 구조로 표준화)
        const campaignOptions = {
            step1Data: normalizedStep1Data,
            step2Data: campaignData.step2Data || {},
            currentStep: campaignData.currentStep || 1,
            lastSavedAt: new Date().toISOString()
        };

        // 전송할 데이터 페이로드 (DB 스키마 필드명과 1:1 매칭)
        // [무결성] 상태/타입 값은 UPPERCASE로 저장
        const draftPayload: any = {
            title: campaignData.title || normalizedStep1Data?.campaignTitle || normalizedStep1Data?.productName || '제목 없음',
            brand_id: normalizedStep1Data?.brandId || null,
            brand_name: normalizedStep1Data?.brandName || null,
            product_name: normalizedStep1Data?.productName || null,
            experience_details: normalizedStep1Data?.experienceDetails || null,
            platform: canonical.canonicalPlatform,
            type: canonical.canonicalType,
            recruitment_start_date: canonical.recruitmentStartDate,
            first_selection_date: canonical.firstSelectionDate,
            end_date: canonical.endDate,
            campaign_options: campaignOptions, // jsonb 객체
            total_recruitment: canonical.totalRecruitmentValue,
            is_unlimited_recruitment: canonical.isUnlimitedRecruitment,
            category: normalizedStep1Data?.category || null,
            region: normalizedStep1Data?.region || null,
            sub_region: normalizedStep1Data?.subRegion || null,
            created_by: userId,
            status: 'DRAFT'
        };

        // 5. ID 처리 및 DB 쿼리 실행
        const isExisting = campaignData.id && !isNaN(Number(campaignData.id)) && Number(campaignData.id) > 0;

        console.log(`[saveDraft] 실제 DB 전송 시작... (${isExisting ? 'UPDATE' : 'INSERT'})`, draftPayload);

        if (isExisting) {
            const { data, error } = await supabase
                .from('campaigns')
                .update(draftPayload)
                .eq('id', Number(campaignData.id))
                .select();

            if (error) throw error;
            return normalizeDraftFromDB(data?.[0]);
        } else {
            const { data, error } = await supabase
                .from('campaigns')
                .insert([draftPayload])
                .select();

            if (error) throw error;
            return normalizeDraftFromDB(data?.[0]);
        }
    } catch (error: any) {
        console.error('saveDraft 최종 실패 원인:', error.message || error);
        throw error;
    }
};

// 임시저장 삭제
export const deleteDraft = async (userId: string, draftId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', draftId)
            .eq('created_by', userId);

        if (error) throw error;
    } catch (error) {
        console.error('임시저장 삭제 실패:', error);
        throw error;
    }
};

// 임시저장 불러오기 (단일)
export const loadDraft = async (userId: string, draftId: string): Promise<DraftCampaign | null> => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', draftId)
            .eq('created_by', userId)
            .single();

        if (error) throw error;
        if (!data) return null;

        return normalizeDraftFromDB(data);
    } catch (error) {
        console.error('임시저장 불러오기 실패:', error);
        return null;
    }
};

// DB 데이터를 DraftCampaign 형식으로 변환 (정규화 핵심 로직)
const normalizeDraftFromDB = (dbData: any): DraftCampaign => {
    if (!dbData) return {} as DraftCampaign;
    const hydration = deriveCampaignHydrationState(dbData);
    const imageVariants = resolveCampaignImageVariants(dbData);
    const step1Data = {
        ...hydration.step1Data,
        brandId: dbData.brand_id || hydration.step1Data.brandId || null,
        brandName: dbData.brand_name || hydration.step1Data.brandName || '',
        productName: dbData.product_name || hydration.step1Data.productName || '',
        campaignTitle: dbData.title || hydration.step1Data.campaignTitle || dbData.product_name || '',
        experienceDetails: dbData.experience_details || hydration.step1Data.experienceDetails || '',
        totalRecruitment: hydration.totalRecruitmentText,
        category: dbData.category || hydration.step1Data.category || '',
        region: dbData.region || hydration.step1Data.region || '',
        subRegion: dbData.sub_region || hydration.step1Data.subRegion || '',
        campaignType: hydration.canonicalType,
        includeReview: hydration.includeReview,
        includeNaver: hydration.includeNaver,
        includeInstagram: hydration.includeInstagram,
        platform: hydration.canonicalPlatform,
        contactPhone: dbData.contact_phone || hydration.options.contact_phone || hydration.step1Data.contactPhone,
        officialPrice: hydration.options.official_price || hydration.step1Data.officialPrice,
        stores: dbData.store_locations || hydration.options.stores || hydration.step1Data.stores || [],
        productOptions: dbData.product_options || hydration.step1Data.productOptions || [],
        scheduleType: hydration.scheduleType,
        recruitmentStartDate: hydration.recruitmentStartDate,
        firstSelectionDate: hydration.firstSelectionDate,
        reviewDeadline: hydration.reviewDeadline,
    };
    const type = normalizeCampaignType(dbData.type || hydration.step1Data?.campaignType || 'VISIT');

    return {
        id: dbData.id.toString(),
        userId: dbData.created_by,
        title: dbData.title || step1Data.campaignTitle || '제목 없음',
        campaignType: (type === 'DELIVERY' ? 'DELIVERY' : type === 'PRESS' ? 'PRESS' : 'VISIT'),
        step1Data: step1Data,
        step2Data: {
            ...hydration.step2Data,
            campaignTitle: dbData.title || hydration.step2Data?.campaignTitle || step1Data.campaignTitle,
            campaignImageVariants: imageVariants,
            campaignImages: imageVariants.length > 0
                ? imageVariants.map((variant) => variant.mediumUrl)
                : ((Array.isArray(dbData.campaign_images) && dbData.campaign_images.length > 0)
                    ? dbData.campaign_images
                    : (Array.isArray(hydration.step2Data?.campaignImages) ? hydration.step2Data.campaignImages : (dbData.thumbnail_url ? [dbData.thumbnail_url] : []))),
            missionGuide: hydration.options.mission_guide || hydration.step2Data?.missionGuide || '',
            keywords: Array.isArray(dbData.keywords) ? dbData.keywords : (Array.isArray(hydration.step2Data?.keywords) ? hydration.step2Data.keywords : []),
        },
        currentStep: hydration.currentStep || 1,
        createdAt: dbData.created_at,
        updatedAt: dbData.updated_at || dbData.created_at,
    };
};

// 캠페인 타입 한글 변환
export const getCampaignTypeLabel = (type: 'DELIVERY' | 'VISIT' | 'PRESS' | string): string => {
    const labels: Record<'DELIVERY' | 'VISIT' | 'PRESS', string> = {
        DELIVERY: '배송체험단',
        VISIT: '방문체험단',
        PRESS: '기자단',
    };
    const normalizedType = String(type || '').toUpperCase();
    return labels[normalizedType as keyof typeof labels] || normalizedType;
};

// 날짜 포맷팅
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
};
