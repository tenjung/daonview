import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import DuplicateCleanupClient from '@/components/admin/DuplicateCleanupClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export default async function DuplicateCleanupPage() {
    const supabase = await createClient();

    // 사용자 인증 확인
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

    if (!profile || profile.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    // 사이드바 카운트 가져오기
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="py-12">
                <DuplicateCleanupClient />
            </div>
        </AdminPageLayout>
    );
}
