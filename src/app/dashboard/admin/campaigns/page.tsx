import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import CampaignTableClient from '@/components/CampaignTableClient';

interface PageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function AdminCampaignsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const type = params.type || 'active';

    const getPageTitle = () => {
        switch (type) {
            case 'pending': return '요청중인 캠페인';
            case 'active': return '진행 중인 캠페인';
            case 'completed': return '완료된 캠페인';
            case 'upcoming': return '진행 예정 캠페인';
            default: return '캠페인 관리';
        }
    };

    // Fetch campaigns on the server
    let query = supabase
        .from('campaigns')
        .select('*, applications(count)')
        .order('created_at', { ascending: false });

    // Apply filters based on type
    if (type === 'pending') {
        query = query.eq('status', 'PENDING');
    } else if (type === 'active') {
        query = query.in('status', ['RECRUITING', 'ONGOING']);
    } else if (type === 'completed') {
        query = query.eq('status', 'COMPLETED');
    } else if (type === 'upcoming') {
        query = query.eq('status', 'RECRUITING');
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching campaigns:', error);
    }

    let campaigns = data || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Client-side filtering logic moved to server for better performance
    if (type === 'active') {
        campaigns = campaigns.filter(cam => {
            const options = Array.isArray(cam.campaign_options) ? cam.campaign_options[0] : cam.campaign_options;
            const startDateStr = options?.step1Data?.recruitmentStartDate;
            if (startDateStr) {
                const startDate = new Date(startDateStr);
                return startDate <= now;
            }
            return true;
        });
    } else if (type === 'upcoming') {
        campaigns = campaigns.filter(cam => {
            const options = Array.isArray(cam.campaign_options) ? cam.campaign_options[0] : cam.campaign_options;
            const startDateStr = options?.step1Data?.recruitmentStartDate;
            if (startDateStr) {
                const startDate = new Date(startDateStr);
                return startDate > now;
            }
            return false;
        });
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                            <p className="text-gray-500 mt-1">
                                {type === 'pending' ? '새로 등록된 캠페인을 검토하고 승인하세요.' :
                                    type === 'active' ? '현재 실시간으로 모집 및 진행 중인 캠페인입니다.' :
                                        type === 'upcoming' ? '승인 완료되었으나 시작일이 남은 캠페인입니다.' :
                                            '종료된 캠페인 내역을 확인합니다.'}
                            </p>
                        </div>
                        <Link href="/dashboard/campaign/new" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">+ 캠페인 신규 등록</Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {getPageTitle()} 목록
                                <span className={`px-2 py-0.5 rounded-full text-xs ${type === 'pending' ? 'bg-rose-100 text-rose-600' :
                                    type === 'active' ? 'bg-green-100 text-green-600' :
                                        type === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {campaigns.length}
                                </span>
                            </h2>
                        </div>

                        <CampaignTableClient initialCampaigns={campaigns} type={type} />
                    </div>
                </div>
            </div>
        </div>
    );
}
