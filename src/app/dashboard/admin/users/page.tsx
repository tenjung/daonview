import { supabase } from '@/lib/supabaseClient';
import UserManagementClient from '@/components/admin/UserManagementClient';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import { Profile } from '@/types/database';

export default async function UserManagementPage() {
    // 유저 데이터 및 카운트 병렬 페칭
    const [profilesRes, sidebarCounts] = await Promise.all([
        supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false }),
        fetchAdminCampaignCounts(supabase)
    ]);

    const users = (profilesRes.data || []) as Profile[];
    
    // 초기 통계 계산
    const stats = users.reduce((acc, user) => {
        acc.total++;
        if (user.role === 'INFLUENCER') acc.influencer++;
        else if (user.role === 'ADVERTISER') acc.advertiser++;
        else if (user.role === 'ADMIN') acc.admin++;
        return acc;
    }, { total: 0, influencer: 0, advertiser: 0, admin: 0 });

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <UserManagementClient 
                initialUsers={users} 
                initialStats={stats} 
            />
        </AdminPageLayout>
    );
}
