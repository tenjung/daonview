// 임시저장 캠페인 관리 유틸리티

import { supabase } from './supabaseClient';

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
        const mappedType = campaignData.campaignType === 'DELIVERY' ? 'DELIVERY' : 'VISIT';

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
        const now = new Date().toISOString().split('T')[0];
        const endDate = campaignData.step1Data?.reviewDeadline ||
            campaignData.step1Data?.recruitmentStartDate ||
            now;

        // 4. campaign_options 구조 (스키마 DEFAULT '[]'에 맞춰 배열로 감쌈)
        const campaignOptions = [{
            step1Data: campaignData.step1Data || {},
            step2Data: campaignData.step2Data || {},
            currentStep: campaignData.currentStep || 1,
            savedAt: new Date().toISOString()
        }];

        // 전송할 데이터 페이로드 (DB 스키마 필드명과 1:1 매칭)
        // [무결성] 상태/타입 값은 UPPERCASE로 저장 (제목/설명은 제외)
        const draftPayload: any = {
            title: campaignData.title || campaignData.step1Data?.campaignTitle || campaignData.step1Data?.productName || '제목 없음',
            brand_id: campaignData.step1Data?.brandId || null,
            brand_name: campaignData.step1Data?.brandName || null,
            product_name: campaignData.step1Data?.productName || null,
            experience_details: campaignData.step1Data?.experienceDetails || null,
            platform: mappedPlatform.toUpperCase(),
            type: (campaignData.campaignType || 'VISIT').toUpperCase(),
            end_date: campaignData.step1Data?.scheduleType === 'always' ? '9999-12-31' : endDate,
            campaign_options: campaignOptions, // jsonb 배열
            recruit_count: parseInt(campaignData.step1Data?.totalRecruitment) || 0,
            total_recruitment: parseInt(campaignData.step1Data?.totalRecruitment) || 0,
            reward_per_person: Number(campaignData.step1Data?.rewardPerPerson || 0),
            is_always: campaignData.step1Data?.scheduleType === 'always',
            category: campaignData.step1Data?.category || null,
            region: campaignData.step1Data?.region || null
        };

        // 5. ID 처리 및 DB 쿼리 실행
        const isExisting = campaignData.id && !isNaN(Number(campaignData.id)) && Number(campaignData.id) > 0;

        if (!isExisting) {
            draftPayload.created_by = userId;
            draftPayload.status = 'DRAFT';
        }

        console.log(`[saveDraft] 실제 DB 전송 시작... (${isExisting ? 'UPDATE' : 'INSERT'})`, draftPayload);

        if (isExisting) {
            const { data, error } = await supabase
                .from('campaigns')
                .update(draftPayload)
                .eq('id', Number(campaignData.id))
                .select();

            if (error) {
                console.error('업데이트 에러:', error);
                throw error;
            }
            console.log('[saveDraft] 업데이트 성공:', data?.[0]?.id);
            return normalizeDraftFromDB(data?.[0]);
        } else {
            const { data, error } = await supabase
                .from('campaigns')
                .insert([draftPayload])
                .select();

            if (error) {
                console.error('인설트 에러:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('저장되었으나 데이터를 반환받지 못했습니다. RLS 정책을 확인해주세요.');
            }

            console.log('[saveDraft] 신규 생성 성공! ID:', data[0].id);
            return normalizeDraftFromDB(data[0]);
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

// DB 데이터를 DraftCampaign 형식으로 변환
const normalizeDraftFromDB = (dbData: any): DraftCampaign => {
    if (!dbData) return {} as DraftCampaign;

    // campaign_options가 배열로 저장되어 있을 경우 첫 번째 요소 사용
    const optionsRaw = dbData.campaign_options;
    const options = Array.isArray(optionsRaw) ? (optionsRaw[0] || {}) : (optionsRaw || {});
    
    // [무결성] DB 컬럼의 값을 step1Data에 우선적으로 반영 (동기화 보장)
    const step1Data = {
        ...(options.step1Data || {}),
        brandId: dbData.brand_id || options.step1Data?.brandId,
        brandName: dbData.brand_name || options.step1Data?.brandName,
        productName: dbData.product_name || options.step1Data?.productName,
        campaignTitle: dbData.title || options.step1Data?.campaignTitle || dbData.product_name,
        experienceDetails: dbData.experience_details || options.step1Data?.experienceDetails,
        totalRecruitment: dbData.total_recruitment?.toString() || dbData.recruit_count?.toString() || options.step1Data?.totalRecruitment || '0',
        rewardPerPerson: dbData.reward_per_person || options.step1Data?.rewardPerPerson || 0,
        category: dbData.category || options.step1Data?.category,
        region: dbData.region || options.step1Data?.region,
        campaignType: (dbData.type || options.step1Data?.campaignType || 'VISIT').toUpperCase()
    };

    // 캠페인 타입 정규화
    let type = (dbData.type || options.step1Data?.campaignType || 'VISIT').toUpperCase();
    if (type === '배송형') type = 'DELIVERY';
    if (type === '방문형') type = 'VISIT';
    if (!['DELIVERY', 'VISIT', 'PRESS'].includes(type)) type = 'VISIT';

    return {
        id: dbData.id.toString(),
        userId: dbData.created_by,
        title: dbData.title || step1Data.campaignTitle,
        campaignType: type as 'DELIVERY' | 'VISIT' | 'PRESS',
        step1Data: step1Data,
        step2Data: options.step2Data || {},
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
