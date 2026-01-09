import { ApplicationStatus } from './database';

// 평가 태그 타입
export type RatingTagType = 'positive' | 'warning' | 'negative';

export interface RatingTag {
    label: string;
    type: RatingTagType;
}

// 평가 태그 정의
export const RATING_TAGS: RatingTag[] = [
    // 긍정 태그
    { label: '리뷰가 빨라요', type: 'positive' },
    { label: '사진이 이뻐요', type: 'positive' },
    { label: '소통이 원활해요', type: 'positive' },
    { label: '성실해요', type: 'positive' },
    { label: '퀄리티가 좋아요', type: 'positive' },

    // 주의 태그
    { label: '리뷰등록이 느려요', type: 'warning' },
    { label: '리뷰지연발생', type: 'warning' },
    { label: '소통이 느려요', type: 'warning' },

    // 부정 태그
    { label: '연락두절 발생', type: 'negative' },
    { label: '약속 미이행', type: 'negative' },
    { label: '리뷰 미작성', type: 'negative' },
];

export interface InfluencerReview {
    id: number;
    influencer_id: string;
    reviewer_id: string;
    campaign_id?: number;
    rating_tags: string[];
    comment?: string;
    created_at: string;
    updated_at: string;

    // Joins
    reviewer?: {
        id: string;
        nickname?: string;
        email?: string;
        role?: string;
        company_name?: string;
    };
    campaign?: {
        id: number;
        title: string;
    };
}

// 인플루언서 평가 통계
export interface InfluencerReviewStats {
    total_reviews: number;
    positive_count: number;
    warning_count: number;
    negative_count: number;
    most_common_tags: string[];
}

// Excel 내보내기용 데이터 타입
export interface ApplicationExportData {
    신청일시: string;
    이름: string;
    이메일: string;
    연락처: string;
    SNS: string;
    상태: string;
    신청메시지: string;
    평가태그: string;
}
