import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import UserManagementClient from '@/components/admin/UserManagementClient';
import { Profile } from '@/types/database';

export default async function AdminUsersPage() {
    const supabase = await createClient();

    // 1. 세션 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        redirect('/login');
    }

    // 2. 관리자 권한 확인
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'ADMIN') {
        redirect('/');
    }

    // 3. 회원 목록, 통계, 캠페인 카운트 데이터 fetch (병렬 처리)
    const today = new Date().toISOString().split('T')[0];

    const [usersRes, pendingRes, recruitingRes, completedRes, draftRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('campaigns').select('id, recruitment_start_date, created_at, status').in('status', ['RECRUITING', 'ONGOING']),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT')
    ]);

    const users = usersRes.data || [];
    const userData = users as Profile[];

    // RECRUITING 데이터를 날짜 기준으로 분리
    const recruitingCampaigns = recruitingRes.data || [];
    let upcomingCount = 0;
    let activeCount = 0;

    recruitingCampaigns.forEach(cam => {
        if (cam.status === 'ONGOING') {
            activeCount++;
            return;
        }
        if (cam.status === 'RECRUITING') {
            const startDateStr = cam.recruitment_start_date || cam.created_at;
            const startDate = startDateStr.split('T')[0];
            if (startDate > today) upcomingCount++;
            else activeCount++;
        }
    });

    const initialSidebarCounts = {
        pending: pendingRes.count || 0,
        upcoming: upcomingCount,
        active: activeCount,
        completed: completedRes.count || 0,
        draft: draftRes.count || 0
    };

    // 회원 통계 계산
    const stats = userData.reduce((acc, user) => {
        acc.total++;
        if (user.role === 'INFLUENCER') acc.influencer++;
        else if (user.role === 'ADVERTISER') acc.advertiser++;
        else if (user.role === 'ADMIN') acc.admin++;
        return acc;
    }, { total: 0, influencer: 0, advertiser: 0, admin: 0 });

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar initialCounts={initialSidebarCounts} />
            <div className="flex-1 bg-gray-50/50 flex flex-col">
                <UserManagementClient 
                    initialUsers={userData} 
                    initialStats={stats} 
                />
            </div>
        </div>
    );
}
