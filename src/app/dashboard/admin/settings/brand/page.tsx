import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import BrandSettingsClient from '@/components/admin/BrandSettingsClient';
import { fetchAdminCampaignCounts } from '@/lib/adminUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BrandSettingsPage() {
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

    // 브랜드 설정 데이터 fetch
    const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'brand_config')
        .single();

    const initialConfig = settings?.value || {
        favicon_url: '',
        logo_url: ''
    };

    // 사이드바 카운트 가져오기
    const sidebarCounts = await fetchAdminCampaignCounts(supabase);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar initialCounts={sidebarCounts} />
            <div className="flex-1 bg-gray-50/50 py-12">
                <div className="container px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">브랜드 설정</h1>
                        <p className="text-gray-500">사이트의 아이덴티티를 나타내는 파비콘과 로고를 관리합니다.</p>
                    </div>
                    <BrandSettingsClient initialConfig={initialConfig} />
                </div>
            </div>
        </div>
    );
}
