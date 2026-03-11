// 임시저장 캠페인 관리 유틸리티

import { supabase } from './supabase/client';
import { buildCampaignSchedule, formatKstDate } from './campaignSchedule';

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
export const saveDraft = async (userId: string, campaignData: {
    id?: string;
    title: string;
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS';
    step1Data: any;
    step2Data?: any;
    currentStep: number;
}): Promise<DraftCampaign> => {
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

        // 2. 유형(type) 및 플랫폼(platform) 매핑 (유저 정의 구조 반영)
        const rawCampaignType = String(campaignData.campaignType || 'VISIT').toUpperCase();
        const mappedType = rawCampaignType === 'DELIVERY'
            ? 'DELIVERY'
            : rawCampaignType === 'PRESS'
                ? 'PRESS'
                : 'VISIT';

        let mappedPlatform = 'PURCHASE';
        if (campaignData.campaignType === 'DELIVERY') {
            if (campaignData.step1Data?.includeNaver) mappedPlatform = 'BLOG';
            else if (campaignData.step1Data?.includeInstagram) mappedPlatform = 'INSTAGRAM';
            else if (campaignData.step1Data?.includeReview) mappedPlatform = 'PURCHASE';
        } else {
            const step1Platform = campaignData.step1Data?.platform;
            if (step1Platform === 'BLOG') mappedPlatform = 'BLOG';
            else if (step1Platform === 'INSTAGRAM') mappedPlatform = 'INSTAGRAM';
        }

        // 3. 날짜 형식 최적화 (YYYY-MM-DD)
        const schedule = buildCampaignSchedule(
            campaignData.step1Data?.scheduleType,
            campaignData.step1Data?.recruitmentStartDate || formatKstDate()
        );
        const endDate = schedule.reviewDeadline;

        const normalizedStep1Data = {
            ...(campaignData.step1Data || {}),
            scheduleType: schedule.scheduleType,
            recruitmentStartDate: schedule.recruitmentStartDate,
            firstSelectionDate: schedule.firstSelectionDate,
            reviewDeadline: schedule.reviewDeadline,
        };

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
            platform: mappedPlatform.toUpperCase(),
            type: mappedType,
            recruitment_start_date: schedule.recruitmentStartDate,
            first_selection_date: schedule.firstSelectionDate,
            end_date: endDate,
            campaign_options: campaignOptions, // jsonb 객체
            recruit_count: parseInt(normalizedStep1Data?.totalRecruitment) || 0,
            total_recruitment: parseInt(normalizedStep1Data?.totalRecruitment) || 0,

            is_always: false,
            category: normalizedStep1Data?.category || null,
            region: normalizedStep1Data?.region || null,
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

    // campaign_options가 배열로 저장되어 있을 수도 있고 객체일 수도 있음 (하위 호환성 보장)
    const optionsRaw = dbData.campaign_options;
    const options = Array.isArray(optionsRaw) ? (optionsRaw[0] || {}) : (optionsRaw || {});

    // [무결성] DB 컬럼의 값을 step1Data에 우선적으로 반영 (동기화 보장)
    // 개별 컬럼이 없을 경우 options 내의 데이터를 백업으로 사용
    const step1Data = {
        ...(options.step1Data || {}),
        brandId: dbData.brand_id || options.step1Data?.brandId,
        brandName: dbData.brand_name || options.step1Data?.brandName,
        productName: dbData.product_name || options.step1Data?.productName,
        campaignTitle: dbData.title || options.step1Data?.campaignTitle || dbData.product_name,
        experienceDetails: dbData.experience_details || options.step1Data?.experienceDetails,
        totalRecruitment: dbData.total_recruitment?.toString() || dbData.recruit_count?.toString() || options.step1Data?.totalRecruitment || '0',

        category: dbData.category || options.step1Data?.category,
        region: dbData.region || options.step1Data?.region,
        campaignType: (dbData.type || options.step1Data?.campaignType || 'VISIT').toUpperCase(),
        platform: (dbData.platform || options.step1Data?.platform || 'BLOG').toUpperCase(),
        // 스키마에 따로 컬럼이 없는 필드들은 options에서 그대로 상속
        contactPhone: options.contact_phone || options.step1Data?.contactPhone,
        officialPrice: options.official_price || options.step1Data?.officialPrice,
        stores: options.stores || options.step1Data?.stores || [],
        productOptions: dbData.product_options || options.step1Data?.productOptions || [],
    };

    // 캠페인 타입 및 플랫폼 정규화
    let type = (dbData.type || options.step1Data?.campaignType || 'VISIT').toUpperCase();
    if (type === '배송형' || type === 'DELIVERY') type = 'DELIVERY';
    else if (type === '방문형' || type === 'VISIT') type = 'VISIT';
    else if (type === '기자단' || type === 'PRESS') type = 'PRESS';
    else type = 'VISIT';

    return {
        id: dbData.id.toString(),
        userId: dbData.created_by,
        title: dbData.title || step1Data.campaignTitle || '제목 없음',
        campaignType: type as 'DELIVERY' | 'VISIT' | 'PRESS',
        step1Data: step1Data,
        step2Data: {
            ...(options.step2Data || {}),
            campaignTitle: dbData.title || options.step2Data?.campaignTitle || step1Data.campaignTitle,
            campaignImages: (Array.isArray(dbData.campaign_images) && dbData.campaign_images.length > 0)
                ? dbData.campaign_images
                : (Array.isArray(options.step2Data?.campaignImages) ? options.step2Data.campaignImages : (dbData.thumbnail_url ? [dbData.thumbnail_url] : [])),
            missionGuide: options.mission_guide || options.step2Data?.missionGuide || '',
            keywords: Array.isArray(dbData.keywords) ? dbData.keywords : (Array.isArray(options.step2Data?.keywords) ? options.step2Data.keywords : []),
        },
        currentStep: options.currentStep || 1,
        createdAt: dbData.created_at,
        updatedAt: dbData.updated_at || dbData.created_at,
    };
};

// 캠페인 타입 한글 변환
export const getCampaignTypeLabel = (type: 'DELIVERY' | 'VISIT' | 'PRESS'): string => {
    const labels = {
        DELIVERY: '배송체험단',
        VISIT: '방문체험단',
        PRESS: '기자단',
    };
    return labels[type] || type;
};

// 날짜 포맷팅
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
};
