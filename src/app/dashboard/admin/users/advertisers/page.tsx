import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/AdminSidebar';
import AdvertiserListClient from '@/components/AdvertiserListClient';

export default async function AdminAdvertisersPage() {
    // 1. 광고주 프로필 및 캠페인 데이터 가져오기 (Join 사용)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            *,
            campaigns:campaigns(status)
        `)
        .eq('role', 'ADVERTISER')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching advertisers:', error);
    }

    const advertisersWithStats = (profiles || []).map((profile) => {
        const campaigns = profile.campaigns || [];

        const stats = {
            total: campaigns.length,
            recruiting: campaigns.filter((c: any) => c.status === 'RECRUITING').length,
            ongoing: campaigns.filter((c: any) => c.status === 'ONGOING').length,
            completed: campaigns.filter((c: any) => c.status === 'COMPLETED').length,
        };

        const paymentStats = {
            total_count: 0,
            total_amount: 0,
        };

        return {
            ...profile,
            campaign_stats: stats,
            payment_stats: paymentStats
        };
    });

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />
            <main className="flex-1 p-10 overflow-y-auto bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">광고주 관리</h1>
                        <p className="text-gray-500 mt-1">등록된 광고주 계정과 캠페인 운영 현황을 관리합니다</p>
                    </div>
                </div>

                <AdvertiserListClient initialAdvertisers={advertisersWithStats} />
            </main>
        </div>
    );
}
