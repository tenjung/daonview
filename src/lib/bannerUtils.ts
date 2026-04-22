import { unstable_cache } from 'next/cache';
import { getPublicServerClient } from './supabase/publicServer';
import { mapCampaignToCard } from './campaignUtils';
import { BannerItem } from '@/components/InteractiveRollingBanner';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';
import type { Campaign } from '@/types/database';

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

        // 2. Parallel Fetch with optimized limits
        const [bannersRes, latestRes, popularRes, steadyRes] = await Promise.all([
            supabase
                .from('banners')
                .select('id, title, subtitle, image_url, link_url, show_content')
                .eq('is_active', true)
                .order('display_order', { ascending: true }),
            supabase
                .from('campaigns')
                .select('*, applications(count)')
                .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
                .order('created_at', { ascending: false })
                .limit(newCount),
            // Optimized: Only fetch what we need (hotCount + buffer for sorting)
            supabase
                .from('campaigns')
                .select('*, applications(count)')
                .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
                .order('created_at', { ascending: false })
                .limit(hotCount + 2),
            // 빠르게 마감되는 캠페인 모음
            supabase
                .from('campaigns')
                .select('*, applications(count)')
                .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[])
                .order('end_date', { ascending: true })
                .limit(4)
        ]);

        if (bannersRes.error || latestRes.error || popularRes.error || steadyRes.error) {
            console.error('[fetchAllBannerData] query errors', {
                banners: bannersRes.error?.message,
                latest: latestRes.error?.message,
                popular: popularRes.error?.message,
                steady: steadyRes.error?.message,
            });
        }

        const bannerRows = (bannersRes.data ?? []) as BannerRow[];
        const latestRows = (latestRes.data ?? []) as CampaignRow[];
        const popularRows = (popularRes.data ?? []) as CampaignRow[];
        const steadyRows = (steadyRes.data ?? []) as CampaignRow[];

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
        const newItems: BannerItem[] = latestRows
            .map(c => {
                const mapped = mapCampaignToCard(c as CampaignCardSource);
                return {
                    id: `new-${c.id}`,
                    type: 'NEW' as const,
                    title: mapped.title,
                    subtitle: mapped.provision || '신규 체험 캠페인',
                    image_url: mapped.imageUrl || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&h=600&fit=crop',
                    link_url: `/campaigns/${c.id}`,
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
                };
            })
            .filter(item => item.image_url && item.title);

        // 5. Process Popular Campaigns
        const popularItems: BannerItem[] = popularRows
            .map(c => mapCampaignToCard(c as CampaignCardSource))
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
        const steadyItems: BannerItem[] = steadyRows
            .map(c => {
                const mapped = mapCampaignToCard(c as CampaignCardSource);
                return {
                    id: `steady-${c.id}`,
                    type: 'STEADY' as const,
                    title: mapped.title,
                    subtitle: mapped.provision || '빠르게 참여 가능한 체험 캠페인',
                    image_url: mapped.imageUrl || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop',
                    link_url: `/campaigns/${c.id}`,
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
                };
            })
            .filter(item => item.image_url && item.title);

        return [...adminItems, ...newItems, ...popularItems, ...steadyItems];
    } catch (err) {
        console.error('Error in fetchAllBannerData:', err);
        return [];
    }
}, ['home-banner-data-v3'], { revalidate: 60, tags: ['home-banner-data'] });

export async function fetchAllBannerData(): Promise<BannerItem[]> {
    return fetchAllBannerDataCached();
}
