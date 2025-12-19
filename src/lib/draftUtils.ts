// 임시저장 캠페인 관리 유틸리티

import { supabase } from './supabaseClient';

export interface DraftCampaign {
    id: string;
    userId: string;
    title: string;
    campaignType: 'delivery' | 'visit' | 'press';
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
    campaignType: 'delivery' | 'visit' | 'press';
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
        const mappedType = campaignData.campaignType === 'delivery' ? '배송형' : '방문형';
        
        let mappedPlatform = '구매평';
        if (campaignData.campaignType === 'delivery') {
            if (campaignData.step1Data?.includeNaver) mappedPlatform = '블로그';
            else if (campaignData.step1Data?.includeInstagram) mappedPlatform = '인스타';
            else if (campaignData.step1Data?.includeReview) mappedPlatform = '구매평';
        } else {
            const step1Platform = campaignData.step1Data?.platform;
            if (step1Platform === 'naver') mappedPlatform = '블로그';
            else if (step1Platform === 'instagram') mappedPlatform = '인스타';
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
        const draftPayload: any = {
            created_by: userId,
            title: campaignData.title || campaignData.step1Data?.productName || '제목 없음',
            platform: mappedPlatform,
            type: mappedType,
            status: 'DRAFT',
            end_date: endDate,
            campaign_options: campaignOptions, // jsonb 배열
            recruit_count: 0, // 기본값
            is_always: false
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
    // campaign_options가 배열로 저장되어 있을 경우 첫 번째 요소 사용
    const optionsRaw = dbData.campaign_options;
    const options = Array.isArray(optionsRaw) ? (optionsRaw[0] || {}) : (optionsRaw || {});

    return {
        id: dbData.id.toString(),
        userId: dbData.created_by,
        title: dbData.title,
        campaignType: (dbData.campaign_type || dbData.type) as 'delivery' | 'visit' | 'press',
        step1Data: options.step1Data || {},
        step2Data: options.step2Data,
        currentStep: options.currentStep || 1,
        createdAt: dbData.created_at,
        updatedAt: dbData.created_at,
    };
};

// 캠페인 타입 한글 변환
export const getCampaignTypeLabel = (type: 'delivery' | 'visit' | 'press'): string => {
    const labels = {
        delivery: '배송체험단',
        visit: '방문체험단',
        press: '기자단',
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
