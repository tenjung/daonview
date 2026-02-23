import { supabase } from '@/lib/supabase/client';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import InquiryListClient from './InquiryListClient';

export const dynamic = 'force-dynamic';

export default async function AdminContactPage() {
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <InquiryListClient />
        </AdminPageLayout>
    );
}
