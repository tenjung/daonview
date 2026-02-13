export type UserRole = 'INFLUENCER' | 'ADVERTISER' | 'ADMIN';
export type CampaignTypeKey = 'VISIT' | 'DELIVERY' | 'PRESS' | 'PURCHASE';
export type PlatformKey = 'BLOG' | 'INSTAGRAM' | 'YOUTUBE' | 'SHORTS' | 'REELS' | 'TIKTOK' | 'PURCHASE' | 'OTHER';
export type CampaignStatus = 'PENDING' | 'RECRUITING' | 'ONGOING' | 'COMPLETED' | 'REJECTED' | 'DRAFT';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'SELECTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface Profile {
    id: string;
    created_at?: string;
    email?: string;
    nickname?: string;
    name?: string;
    company_name?: string;
    role?: UserRole;
    phone_number?: string;
    sns_url?: string;
    blog_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    tiktok_url?: string;
    point?: number;
    avatar_url?: string;
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
    zip_code?: string;
    address_base?: string;
    address_detail?: string;
    biz_number?: string;
    biz_certificate_url?: string;
    biz_verification_status?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    biz_verification_requested_at?: string;
    biz_rejection_reason?: string;
    email_subscription_status?: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED' | 'COMPLAINED';
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
    region?: string;
    sub_region?: string;

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
    product_url_individual?: boolean;
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
    cancellation_reason?: string;
    cancelled_at?: string;
    selected_option?: string;
    application_message?: string;

    // Joins
    campaign?: Campaign;
    user?: Profile;

    [key: string]: any;
}

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
    reviewer?: Profile;
    campaign?: Campaign;

    [key: string]: any;
}

export interface InfluencerStats {
    id: number;
    user_id: string;
    platform: string; // 'NAVER_BLOG', 'INSTAGRAM', 'YOUTUBE', etc.
    blog_url: string; // URL of the blog or social media profile

    // 기본 지표 (사용 안 함)
    visitor_today: number;
    visitor_yesterday: number;
    visitor_total: number;
    neighbor_count: number;
    avg_likes: number;
    avg_comments: number;
    avg_engagement: number;

    // 컨텐츠 분석
    main_categories: string[];
    category_stats?: any;
    recent_posts?: any[];

    // 종합 점수
    influence_score: number;

    // 메타 정보
    last_crawled_at?: string;
    crawl_status: string; // 'SUCCESS', 'FAILED', 'PENDING', 'DISABLED'
    crawl_error?: string;
    created_at: string;
    updated_at: string;

    [key: string]: any;
}

export type User = Profile;

