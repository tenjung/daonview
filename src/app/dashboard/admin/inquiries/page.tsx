import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { supabase } from '@/lib/supabase/client';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import InquiriesClient from './InquiriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage() {
    await requireDashboardRole('ADMIN');
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <InquiriesClient />
        </AdminPageLayout>
    );
}
