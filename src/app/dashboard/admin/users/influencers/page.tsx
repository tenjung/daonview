import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/AdminSidebar';
import InfluencerListClient from '@/components/InfluencerListClient';

export default async function AdminInfluencersPage() {
    // 1. 인플루언서 프로필 및 신청 데이터 가져오기 (Join 사용)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            *,
            applications:applications(status)
        `)
        .eq('role', 'INFLUENCER')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching influencers:', error);
    }

    const influencersWithStats = (profiles || []).map((profile) => {
        const apps = profile.applications || [];

        const total = apps.length;
        const selected = apps.filter((a: any) => ['SELECTED', 'COMPLETED'].includes(a.status)).length;
        const completed = apps.filter((a: any) => a.status === 'COMPLETED').length;

        return {
            ...profile,
            activity_stats: {
                total_applied: total,
                total_selected: selected,
                total_completed: completed,
                selection_rate: total > 0 ? Math.round((selected / total) * 100) : 0
            }
        };
    });

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />
            <main className="flex-1 p-10 overflow-y-auto bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">인플루언서 관리</h1>
                        <p className="text-gray-500 mt-1">인플루언서 회원들의 활동 현황과 리뷰 이행률을 관리합니다</p>
                    </div>
                </div>

                <InfluencerListClient initialInfluencers={influencersWithStats} />
            </main>
        </div>
    );
}
