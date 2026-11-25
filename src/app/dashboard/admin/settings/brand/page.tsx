import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import { Palette } from 'lucide-react';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import BrandSettingsClient from '@/components/admin/BrandSettingsClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BrandSettingsPage() {
    await requireDashboardRole('ADMIN');
    const { supabase } = await getRequestAuth();

    const [settingsResult, sidebarCounts] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'brand_config').single(),
        fetchAdminCampaignCounts(supabase),
    ]);
    if (settingsResult.error) throw new Error('브랜드 설정을 불러오지 못했습니다.');
    const initialConfig = settingsResult.data?.value || { favicon_url: '', logo_url: '' };
    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div>
                <div>
                    <DashboardPageHeader
                        icon={Palette}
                        title="브랜드 설정"
                        description="사이트의 아이덴티티를 나타내는 파비콘과 로고를 관리합니다."
                    />
                    <BrandSettingsClient initialConfig={initialConfig} />
                </div>
            </div>
        </AdminPageLayout>
    );
}
