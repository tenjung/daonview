export interface Profile {
    id: string;
    created_at?: string;
    email?: string;
    nickname?: string;
    company_name?: string;
    role?: 'INFLUENCER' | 'ADVERTISER' | 'ADMIN';
    phone_number?: string;
    sns_url?: string;
    point?: number;
    avatar_url?: string;
    [key: string]: any;
}

export interface Campaign {
    id: number;
    created_at?: string;
    title: string;
    description?: string;
    recruit_count?: number;
    end_date: string;
    is_always?: boolean;
    category?: string;
    thumbnail_url?: string;
    provision?: string;
    platform?: string;
    type?: string;
    applications?: any;
    [key: string]: any;
}

export interface Application {
    id: number;
    created_at: string;
    status: string;
    message: string;
    campaign_id: number;
    user_id: string;
    [key: string]: any;
}
