import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import { Image as ImageIcon } from 'lucide-react';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { createClient } from '@/lib/supabase/server';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import BannerManagementClient from '@/components/BannerManagementClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export default async function BannerManagementPage() {
    await requireDashboardRole('ADMIN');
    const supabase = await createClient();

    // Fetch Banners, Config, and Sidebar counts in parallel on the server
    const [bannersRes, configRes, sidebarCounts] = await Promise.all([
        supabase.from('banners').select('*').order('display_order', { ascending: true }),
        supabase.from('site_settings').select('value').eq('key', 'banner_config').single(),
        fetchAdminCampaignCounts(supabase)
    ]);

    const banners = bannersRes.data || [];
    const config = configRes.data?.value || { new_count: 4, hot_count: 4 };

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div>
                <div className="max-w-5xl">
                    <DashboardPageHeader
                        icon={ImageIcon}
                        title="배너 관리 & 설정"
                        description="배너 노출 순서와 자동 노출 캠페인 개수를 제어합니다."
                    />

                    <BannerManagementClient initialBanners={banners} initialConfig={config} />
                </div>
            </div>
        </AdminPageLayout>
    );
}
