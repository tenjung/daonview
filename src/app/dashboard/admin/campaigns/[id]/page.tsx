import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import ApplicationsTableClient from '@/components/admin/ApplicationsTableClient';
import { ArrowLeft, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

// Next.js 캐싱 비활성화 (매번 최신 데이터 가져오기)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CampaignApplicationsPage({ params }: PageProps) {
    const { id } = await params;

    // 캠페인 기본 정보 조회
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
            *,
            profiles:created_by (
                id,
                nickname,
                email,
                company_name
            )
        `)
        .eq('id', id)
        .single();

    if (campaignError || !campaign) {
        notFound();
    }

    // 신청자 목록 조회 (인플루언서 정보 포함)
    const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select(`
            *,
            user:profiles!applications_user_id_fkey (
                id,
                nickname,
                email,
                phone_number,
                sns_url
            )
        `)
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

    if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
    }

    const applicationsList = applications || [];

    // 통계 계산
    const stats = {
        total: applicationsList.length,
        pending: applicationsList.filter(app => app.status?.toUpperCase() === 'PENDING').length,
        approved: applicationsList.filter(app => app.status?.toUpperCase() === 'APPROVED').length,
        rejected: applicationsList.filter(app => app.status?.toUpperCase() === 'REJECTED').length,
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* 헤더 */}
                    <div className="mb-6">
                        <Link
                            href="/dashboard/admin/campaigns?type=active"
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            진행 중인 캠페인으로 돌아가기
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">신청자 관리</h1>
                        <p className="text-gray-500 mt-1">
                            캠페인에 신청한 인플루언서를 확인하고 선정하세요.
                        </p>
                    </div>

                    {/* 캠페인 정보 카드 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-bold text-gray-900">{campaign.title}</h2>
                                    {(() => {
                                        const status = campaign.status?.toUpperCase();
                                        if (status === 'RECRUITING') {
                                            return (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    모집중
                                                </span>
                                            );
                                        } else if (status === 'ONGOING') {
                                            return (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    진행중
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>마감: {new Date(campaign.end_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={16} />
                                        <span>모집 인원: {campaign.recruit_count}명</span>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href={`/campaigns/${campaign.id}`}
                                className="btn btn-outline text-sm"
                            >
                                캠페인 상세보기
                            </Link>
                        </div>
                    </div>

                    {/* 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">총 신청자</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Users className="text-gray-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">대기중</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Clock className="text-yellow-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">승인됨</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="text-green-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">거절됨</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="text-red-600" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 신청자 목록 테이블 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                신청자 목록
                                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">
                                    {stats.total}
                                </span>
                            </h2>
                        </div>

                        <ApplicationsTableClient
                            initialApplications={applicationsList}
                            campaignId={id}
                            campaignTitle={campaign.title}
                            campaignCategory={campaign.category}
                            recruitCount={campaign.recruit_count}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
