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
        // 필수 필드 채우기 (NOT NULL 제약조건 만족용)
        // step1Data가 항상 존재한다는 가정하에
        const platform = campaignData.step1Data?.platform || 'OTHER'; // DB NOT NULL 제약 대응
        const type = campaignData.campaignType;
        const endDate = campaignData.step1Data?.reviewDeadline || campaignData.step1Data?.recruitmentStartDate || new Date().toISOString();

        // campaign_options에 전체 데이터 저장하여 상태 보존
        const campaignOptions = {
            step1Data: campaignData.step1Data,
            step2Data: campaignData.step2Data,
            currentStep: campaignData.currentStep,
            draftId: campaignData.id // 기존 로컬 ID 유지용 (필요시)
        };

        const draftPayload = {
            created_by: userId,
            title: campaignData.title,
            platform: platform,
            type: type,
            campaign_type: type,
            status: 'DRAFT',
            end_date: endDate,
            campaign_options: campaignOptions,
            // 필요한 경우 id 업데이트 (기존 draft가 DB에 있는 경우)
            ...(campaignData.id && !isNaN(Number(campaignData.id)) ? { id: Number(campaignData.id) } : {})
        };

        const { data, error } = await supabase
            .from('campaigns')
            .upsert(draftPayload)
            .select()
            .single();

        if (error) throw error;

        return normalizeDraftFromDB(data);
    } catch (error) {
        console.error('임시저장 실패:', error);
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
    const options = dbData.campaign_options || {};
    return {
        id: dbData.id.toString(),
        userId: dbData.created_by,
        title: dbData.title,
        campaignType: dbData.campaign_type as 'delivery' | 'visit' | 'press',
        step1Data: options.step1Data || {},
        step2Data: options.step2Data,
        currentStep: options.currentStep || 1,
        createdAt: dbData.created_at,
        updatedAt: dbData.created_at, // DB에 updated_at이 없다면 created_at 사용
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
