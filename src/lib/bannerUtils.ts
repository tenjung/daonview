import { unstable_cache } from 'next/cache';
import { getPublicServerClient } from './supabase/publicServer';
import { mapCampaignToCard } from './campaignUtils';
import { BannerItem } from '@/components/InteractiveRollingBanner';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';
import type { Campaign } from '@/types/database';
import { CAMPAIGN_CARD_SELECT } from './campaignSelects';

type BannerRow = {
    id: number | string;
    title?: string;
    subtitle?: string;
    image_url?: string;
    link_url?: string;
    show_content?: boolean;
};

type CampaignRow = {
    id: number | string;
    end_date?: string | null;
    [key: string]: unknown;
};

type CampaignCardSource = Campaign & {
    applications?: { count: number }[] | { count: number } | number;
};

const fetchAllBannerDataCached = unstable_cache(async (): Promise<BannerItem[]> => {
    try {
        const supabase = getPublicServerClient();
        // 1. Fetch banner configuration from site_settings (with fallback)
        let newCount = 4;
        let hotCount = 4;

        try {
            const { data: configData, error: configError } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'banner_config')
                .single();

            const configValue = (configData as { value?: unknown } | null)?.value;
            if (!configError && configValue && typeof configValue === 'object') {
                const parsed = configValue as { new_count?: unknown; hot_count?: unknown };
                if (typeof parsed.new_count === 'number') {
                    newCount = parsed.new_count;
                }
                if (typeof parsed.hot_count === 'number') {
                    hotCount = parsed.hot_count;
                }
            }
        } catch (configErr) {
            console.warn('Failed to fetch banner config, using defaults');
        }

        // 홈에서 campaigns를 3번 반복 조회하지 않고, 1회 최소 필드 조회 후 메모리에서 분기합니다.
        const [bannersRes, campaignsRes] = await Promise.all([
            supabase
                .from('banners')
                .select('id, title, subtitle, image_url, link_url, show_content')
                .eq('is_active', true)
                .order('display_order', { ascending: true }),
            supabase
                .from('campaigns')
                .select(CAMPAIGN_CARD_SELECT)
                .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
                .order('created_at', { ascending: false })
        ]);

        if (bannersRes.error || campaignsRes.error) {
            console.error('[fetchAllBannerData] query errors', {
                banners: bannersRes.error?.message,
                campaigns: campaignsRes.error?.message,
            });
        }

        const bannerRows = (bannersRes.data ?? []) as BannerRow[];
        const campaignRows = (campaignsRes.data ?? []) as CampaignRow[];
        const mappedCampaigns = campaignRows.map((campaign) => mapCampaignToCard(campaign as CampaignCardSource));
        const mappedCampaignById = new Map(mappedCampaigns.map((campaign) => [String(campaign.id), campaign]));

        // 3. Process Admin Banners
        const adminItems: BannerItem[] = bannerRows.map(b => ({
            id: `admin-${b.id}`,
            type: 'ADMIN',
            title: b.title || '다온 추천 캠페인',
            subtitle: b.subtitle,
            image_url: b.image_url || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&h=600&fit=crop',
            link_url: b.link_url || '#',
            badge: 'SPECIAL',
            label: '다온 PICK',
            show_content: b.show_content
        }));

        // 4. Process Latest Campaigns
        const newItems = campaignRows
            .slice(0, newCount)
            .flatMap((campaign): BannerItem[] => {
                const mapped = mappedCampaignById.get(String(campaign.id));
                if (!mapped?.imageUrl || !mapped.title) return [];
                return [{
                    id: `new-${campaign.id}`,
                    type: 'NEW' as const,
                    title: mapped.title,
                    subtitle: mapped.provision || '신규 체험 캠페인',
                    image_url: mapped.imageUrl,
                    link_url: `/campaigns/${campaign.id}`,
                    badge: 'NEW',
                    extra_badge: mapped.type === 'VISIT' ? '방문' : '배송',
                    applicants: mapped.applicants || 0,
                    total: mapped.total || 0,
                    dday: mapped.dday,
                    platform: mapped.platform,
                    campaignType: mapped.type,
                    includeReview: mapped.includeReview,
                    includeNaver: mapped.includeNaver,
                    includeInstagram: mapped.includeInstagram,
                    region: mapped.region || undefined,
                    sub_region: mapped.sub_region || undefined,
                    is_unlimited_recruitment: mapped.is_unlimited_recruitment,
                    scheduleType: mapped.scheduleType,
                }];
            })
            .filter((item) => item.image_url && item.title);

        // 5. Process Popular Campaigns
        const popularItems: BannerItem[] = [...mappedCampaigns]
            .sort((a, b) => (b.applicants || 0) - (a.applicants || 0))
            .slice(0, hotCount)
            .map((mapped, index) => {
                const isVisit = mapped.type === 'VISIT';
                const hasManyApplicants = (mapped.applicants || 0) >= 5;

                return {
                    id: `pop-${mapped.id}`,
                    type: 'POPULAR' as const,
                    title: mapped.title,
                    subtitle: mapped.provision || '인기 폭발 캠페인',
                    image_url: mapped.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
                    link_url: `/campaigns/${mapped.id}`,
                    badge: hasManyApplicants ? 'HOT' : undefined,
                    isBest: isVisit && index < 2, // Only top 2 Visit campaigns get BEST
                    extra_badge: isVisit ? '방문' : '배송',
                    applicants: mapped.applicants || 0,
                    total: mapped.total || 0,
                    dday: mapped.dday,
                    platform: mapped.platform,
                    campaignType: mapped.type,
                    includeReview: mapped.includeReview,
                    includeNaver: mapped.includeNaver,
                    includeInstagram: mapped.includeInstagram,
                    region: mapped.region || undefined,
                    sub_region: mapped.sub_region || undefined,
                    is_unlimited_recruitment: mapped.is_unlimited_recruitment,
                    scheduleType: mapped.scheduleType,
                };
            })
            .filter(item => item.image_url && item.title);

        // 6. Process Steady lane
        const steadyItems = [...campaignRows]
            .sort((a, b) => {
                const aMapped = mappedCampaignById.get(String(a.id));
                const bMapped = mappedCampaignById.get(String(b.id));
                const aDate = aMapped?.is_unlimited_recruitment || aMapped?.scheduleType === 'FAST'
                    ? Number.MAX_SAFE_INTEGER
                    : new Date(String(a.end_date || '')).getTime();
                const bDate = bMapped?.is_unlimited_recruitment || bMapped?.scheduleType === 'FAST'
                    ? Number.MAX_SAFE_INTEGER
                    : new Date(String(b.end_date || '')).getTime();
                return aDate - bDate;
            })
            .slice(0, 4)
            .flatMap((campaign): BannerItem[] => {
                const mapped = mappedCampaignById.get(String(campaign.id));
                if (!mapped?.imageUrl || !mapped.title) return [];
                return [{
                    id: `steady-${campaign.id}`,
                    type: 'STEADY' as const,
                    title: mapped.title,
                    subtitle: mapped.provision || '빠르게 참여 가능한 체험 캠페인',
                    image_url: mapped.imageUrl,
                    link_url: `/campaigns/${campaign.id}`,
                    badge: 'FAST',
                    extra_badge: mapped.type === 'VISIT' ? '방문' : '배송',
                    applicants: mapped.applicants || 0,
                    total: mapped.total || 0,
                    dday: mapped.dday,
                    platform: mapped.platform,
                    campaignType: mapped.type,
                    includeReview: mapped.includeReview,
                    includeNaver: mapped.includeNaver,
                    includeInstagram: mapped.includeInstagram,
                    region: mapped.region || undefined,
                    sub_region: mapped.sub_region || undefined,
                    is_unlimited_recruitment: mapped.is_unlimited_recruitment,
                    scheduleType: mapped.scheduleType,
                }];
            })
            .filter((item) => item.image_url && item.title);

        return [...adminItems, ...newItems, ...popularItems, ...steadyItems];
    } catch (err) {
        console.error('Error in fetchAllBannerData:', err);
        return [];
    }
}, ['home-banner-data-v4'], { revalidate: 60, tags: ['home-banner-data'] });

export async function fetchAllBannerData(): Promise<BannerItem[]> {
    return fetchAllBannerDataCached();
}
