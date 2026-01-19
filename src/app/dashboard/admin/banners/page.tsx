import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/AdminSidebar';
import BannerManagementClient from '@/components/BannerManagementClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export default async function BannerManagementPage() {
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
        <div className="flex min-h-screen bg-gray-50 text-foreground">
            <AdminSidebar initialCounts={sidebarCounts} />
            <main className="flex-1 p-8">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">배너 관리 & 설정</h1>
                            <p className="text-gray-500 text-sm font-medium">배너 노출 순서와 자동 노출 캠페인 개수를 제어합니다.</p>
                        </div>
                    </header>

                    <BannerManagementClient initialBanners={banners} initialConfig={config} />
                </div>
            </main>
        </div>
    );
}
