import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import ReviewUpdateClient from '@/components/admin/ReviewUpdateClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UpdateReviewsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role?.toUpperCase() !== 'ADMIN') {
        redirect('/');
    }

    // 사이드바 카운트 가져오기
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar initialCounts={sidebarCounts} />
            <div className="flex-1 bg-gray-50 py-12">
                <ReviewUpdateClient />
            </div>
        </div>
    );
}
