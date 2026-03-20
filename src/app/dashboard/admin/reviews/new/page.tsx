import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import BulkReviewClient from '@/components/admin/BulkReviewClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BulkReviewPage() {
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

    if (profile?.role?.toUpperCase() !== 'ADMIN') {
        redirect('/');
    }

    // 사이드바 카운트 가져오기
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="bg-gray-50 py-12">
                <BulkReviewClient user={user} />
            </div>
        </AdminPageLayout>
    );
}
