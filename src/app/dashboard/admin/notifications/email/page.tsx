import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import { Mail } from 'lucide-react';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import EmailTemplateManager from '@/components/admin/EmailTemplateManager';
import CampaignEmailComposer from '@/components/admin/CampaignEmailComposer';
import {
    AdminCampaignEmailRawCampaign,
    normalizeAdminCampaignForEmail,
} from '@/lib/adminCampaignEmail';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminEmailNotificationsPage() {
    await requireDashboardRole('ADMIN');
    const { supabase, user } = await getRequestAuth();

    const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
            id,
            title,
            status,
            type,
            platform,
            category,
            region,
            sub_region,
            brand_name,
            product_name,
            experience_details,
            description,
            thumbnail_url,
            campaign_image_variants,
            end_date,
            campaign_options,
            store_locations
        `)
        .in('status', ['RECRUITING', 'ONGOING'])
        .in('type', ['DELIVERY', 'VISIT'])
        .order('created_at', { ascending: false });

    if (campaignsError) {
        console.error('Error fetching active campaigns for email composer:', campaignsError);
    }

    const emailCampaigns = ((activeCampaigns || []) as AdminCampaignEmailRawCampaign[])
        .map(normalizeAdminCampaignForEmail)
        .filter((campaign) => campaign !== null);

    return (
        <AdminPageLayout>
            <DashboardPageHeader icon={Mail} title="이메일 전송 관리" description="이메일 템플릿을 미리보기하고 수정할 수 있습니다." />
            <div className="space-y-8">
                <CampaignEmailComposer campaigns={emailCampaigns} />
                <EmailTemplateManager />
            </div>
        </AdminPageLayout>
    );
}
