import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'ADMIN') {
        redirect('/dashboard');
    }

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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">이메일 전송 관리</h1>
                <p className="text-gray-600">이메일 템플릿을 미리보기하고 수정할 수 있습니다</p>
            </div>
            <div className="space-y-8">
                <CampaignEmailComposer campaigns={emailCampaigns} />
                <EmailTemplateManager />
            </div>
        </AdminPageLayout>
    );
}
