import { supabase } from '@/lib/supabaseClient';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import InquiryDetailClient from './InquiryDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await params; // Next.js 15+ 대응
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <InquiryDetailClient />
        </AdminPageLayout>
    );
}
