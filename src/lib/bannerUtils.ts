import { supabase } from './supabaseClient';
import { mapCampaignToCard } from './campaignUtils';
import { BannerItem } from '@/components/InteractiveRollingBanner';

export async function fetchAllBannerData(): Promise<BannerItem[]> {
    try {
        // 1. Fetch banner configuration from site_settings (with fallback)
        let newCount = 4;
        let hotCount = 4;

        try {
            const { data: configData, error: configError } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'banner_config')
                .single();

            if (!configError && configData?.value) {
                newCount = (configData.value as any).new_count || 4;
                hotCount = (configData.value as any).hot_count || 4;
            }
        } catch (configErr) {
            console.warn('Failed to fetch banner config, using defaults');
        }

        // 2. Parallel Fetch with optimized limits
        const [bannersRes, latestRes, popularRes, steadyRes] = await Promise.all([
            supabase.from('banners').select('*').eq('is_active', true).order('display_order', { ascending: true }),
            supabase.from('campaigns').select('*, applications(count)').in('status', ['RECRUITING', 'ONGOING']).order('created_at', { ascending: false }).limit(newCount),
            // Optimized: Only fetch what we need (hotCount + buffer for sorting)
            supabase.from('campaigns').select('*, applications(count)').in('status', ['RECRUITING', 'ONGOING']).limit(hotCount + 2),
            // Always fetching some always-open campaigns
            supabase.from('campaigns').select('*, applications(count)').eq('is_always', true).in('status', ['RECRUITING', 'ONGOING']).limit(4)
        ]);

        // 3. Process Admin Banners
        const adminItems: BannerItem[] = (bannersRes.data || []).map(b => ({
            id: `admin-${b.id}`,
            type: 'ADMIN',
            title: b.title,
            subtitle: b.subtitle,
            image_url: b.image_url,
            link_url: b.link_url || '#',
            badge: 'SPECIAL',
            label: '다온 PICK',
            show_content: b.show_content
        }));

        // 4. Process Latest Campaigns
        const newItems: BannerItem[] = (latestRes.data || [])
            .map(c => {
                const mapped = mapCampaignToCard(c as any);
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
                    dday: mapped.dday
                };
            })
            .filter(item => item.image_url && item.title);

        // 5. Process Popular Campaigns
        const popularItems: BannerItem[] = (popularRes.data || [])
            .map(c => mapCampaignToCard(c as any))
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
                    dday: mapped.dday
                };
            })
            .filter(item => item.image_url && item.title);

        // 6. Process Steady (Always) Campaigns
        const steadyItems: BannerItem[] = (steadyRes.data || [])
            .map(c => {
                const mapped = mapCampaignToCard(c as any);
                return {
                    id: `steady-${c.id}`,
                    type: 'STEADY' as const,
                    title: mapped.title,
                    subtitle: mapped.provision || '상시 모집 체험 캠페인',
                    image_url: mapped.imageUrl || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop',
                    link_url: `/campaigns/${c.id}`,
                    badge: 'ALWAYS',
                    extra_badge: mapped.type === 'VISIT' ? '방문' : '배송',
                    applicants: mapped.applicants || 0,
                    total: mapped.total || 0,
                    dday: mapped.dday
                };
            })
            .filter(item => item.image_url && item.title);

        return [...adminItems, ...newItems, ...popularItems, ...steadyItems];
    } catch (err) {
        console.error('Error in fetchAllBannerData:', err);
        return [];
    }
}
