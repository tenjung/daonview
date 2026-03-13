import { createClient } from '@/lib/supabase/server';
import CommunityManagementClient from '@/components/admin/CommunityManagementClient';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';
import { MessageSquare } from 'lucide-react';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';

export const dynamic = 'force-dynamic';

export default async function AdminCommunityPage() {
    await requireDashboardRole('ADMIN');
    const supabase = await createClient();
    // 1. 데이터 페칭 (posts 와 notices 테이블 모두 가져오기)
    const [postsRes, noticesRes, sidebarCounts] = await Promise.all([
        supabase
            .from('posts')
            .select(`
                *,
                profiles (
                    nickname,
                    name,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false }),
        supabase
            .from('notices')
            .select(`
                *,
                profiles:profiles!author_id (
                    nickname,
                    name,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false }),
        fetchAdminCampaignCounts(supabase)
    ]);

    // 2. 데이터 정규화 및 병합
    // notices 테이블의 데이터는 '공지', '이벤트' 타입을 가짐
    const notices = (noticesRes.data || []).map(item => ({
        ...item,
        // notices 테이블은 author_id를 사용하므로 user_id로 통일할 필요가 있다면 여기서 함
        user_id: item.author_id,
        // profile은 이미 select에서 alias 처리됨
    }));

    const posts = postsRes.data || [];
    
    // 합치고 날짜 역순 정렬
    const allPosts = [...notices, ...posts].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 3. 통계 계산
    const stats = allPosts.reduce((acc, post) => {
        acc.total++;
        const type = String(post.type).toLowerCase();
        if (type === '공지' || type === 'notice') acc.notice++;
        else if (type === 'free') acc.free++;
        else if (type === '이벤트' || type === 'event') acc.event++;
        else if (type.includes('academy')) acc.academy++;
        else if (type === 'faq') acc.faq++;
        else if (type === 'guide') acc.guide++;
        return acc;
    }, { total: 0, notice: 0, free: 0, event: 0, academy: 0, faq: 0, guide: 0 });

    return (
        <AdminPageLayout sidebarCounts={sidebarCounts}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <MessageSquare className="w-8 h-8 text-primary" />
                        커뮤니티 통합 관리
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">
                        공지사항부터 자유게시판까지, 모든 커뮤니티 활동을 한곳에서 쉽고 빠르게 관리하세요.
                    </p>
                </div>
            </div>

            <CommunityManagementClient 
                initialPosts={allPosts} 
                initialStats={stats} 
            />
        </AdminPageLayout>
    );
}
