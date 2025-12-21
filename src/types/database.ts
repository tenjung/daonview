export type UserRole = 'INFLUENCER' | 'ADVERTISER' | 'ADMIN';
export type CampaignTypeKey = 'VISIT' | 'DELIVERY' | 'PRESS' | 'PURCHASE';
export type PlatformKey = 'BLOG' | 'INSTAGRAM' | 'YOUTUBE' | 'SHORTS' | 'REELS' | 'TIKTOK' | 'PURCHASE' | 'OTHER';
export type CampaignStatus = 'PENDING' | 'RECRUITING' | 'ONGOING' | 'COMPLETED' | 'REJECTED' | 'DRAFT';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Profile {
    id: string;
    created_at?: string;
    email?: string;
    nickname?: string;
    company_name?: string;
    role?: UserRole;
    phone_number?: string;
    sns_url?: string;
    point?: number;
    avatar_url?: string;
    [key: string]: any;
}

// Common fields shared across all campaign types
export interface BaseCampaign {
    id: number;
    created_at?: string;
    title: string;
    description?: string;
    status: CampaignStatus;

    // Recruitment
    recruit_count: number;
    total_recruitment?: number;
    recruitment_start_date?: string;
    end_date: string;
    first_selection_date?: string;
    review_deadline?: string;
    is_always?: boolean;

    // Classification
    category?: string;
    platform: PlatformKey | string; // Allow string for legacy compatibility but prefer PlatformKey

    // Content
    provision?: string;
    experience_details?: string;
    mission_guide?: string;
    keywords?: string[];
    prohibited_words?: string[];
    additional_notes?: string;

    // Media
    thumbnail_url?: string;
    campaign_images?: string[];
    sub_image_1?: string;
    sub_image_2?: string;

    // Relations
    applications?: any;

    // JSONB for extra options (Drafts, etc.)
    campaign_options?: any;

    // Fallback for any other properties (DB robustness)
    [key: string]: any;
}

export interface VisitCampaign extends BaseCampaign {
    type: 'VISIT';

    // Visit specific fields
    store_name?: string;
    store_address?: string;
    naver_map_url?: string;
    visit_time?: string;
    visit_days?: string[];
    visit_notes?: string;
    contact_phone?: string;
    stores?: any[];
}

export interface DeliveryCampaign extends BaseCampaign {
    type: 'DELIVERY';

    // Delivery specific fields
    product_name?: string;
    product_url?: string;
    product_price?: number;
    product_options?: string[];
    product_url_private?: boolean;
    reward_per_person?: number;
    payment_method?: string;
}

export interface PressCampaign extends BaseCampaign {
    type: 'PRESS';
    // Press specific fields (usually similar to Visit but remote)
}

export interface PurchaseCampaign extends BaseCampaign {
    type: 'PURCHASE';
    // Purchase specific fields
}

// Discriminated Union
export type Campaign = VisitCampaign | DeliveryCampaign | PressCampaign | PurchaseCampaign;

export interface Application {
    id: number;
    created_at: string;
    status: ApplicationStatus;
    message: string;
    campaign_id: number;
    user_id: string;

    // Joins
    campaign?: Campaign;
    user?: Profile;

    [key: string]: any;
}
