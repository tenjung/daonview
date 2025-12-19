'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Profile, Application, Campaign } from '@/types/database';
import DashboardSidebar from '@/components/DashboardSidebar';

interface ApplicationWithCampaign extends Application {
    campaigns: Campaign;
}

export default function InfluencerDashboard() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [applications, setApplications] = useState<ApplicationWithCampaign[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch user profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);

            // Fetch applications with campaign details
            const { data: applicationsData } = await supabase
                .from('applications')
                .select('*, campaigns(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (applicationsData) {
                setApplications(applicationsData as ApplicationWithCampaign[]);

                // Calculate stats
                const total = applicationsData.length;
                const approved = applicationsData.filter(app => app.status === 'approved').length;
                // 작성해야 할 리뷰 = 승인된 캠페인 중 리뷰 미제출 건수
                // TODO: applications 테이블에 review_submitted 필드 추가 필요
                // 임시로 approved 상태를 사용 (실제로는 approved && !review_submitted)
                const needsReview = applicationsData.filter(app => app.status === 'approved').length;

                setStats({ total, approved, pending: needsReview });
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-600">심사중</span>;
            case 'approved':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-600">선정됨</span>;
            case 'rejected':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-600">미선정</span>;
            case 'completed':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-600">완료</span>;
            default:
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-gray-50 text-gray-600">{status}</span>;
        }
    };

    const getStatusNote = (status: string) => {
        switch (status) {
            case 'approved':
                return '가이드 확인 필요';
            case 'rejected':
                return '아쉽게도 선정되지 않았습니다.';
            default:
                return '-';
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar
                userType="INFLUENCER"
                userName={profile?.nickname || '사용자'}
                links={[
                    { href: '/dashboard/influencer', label: '대시보드', active: true },
                    { href: '/dashboard/influencer/campaigns', label: '나의 캠페인' },
                    { href: '/dashboard/influencer/favorites', label: '관심 캠페인' },
                    { href: '/dashboard/influencer/settings', label: '계정 설정' },
                    { href: '/contact', label: '1:1 문의' }
                ]}
            />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-text-main">나의 활동</h1>
                    <Link href="/campaigns" className="btn btn-primary text-sm px-4 py-2">캠페인 찾아보기</Link>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">신청한 캠페인</div>
                        <div className="text-3xl font-bold text-primary">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">선정된 캠페인</div>
                        <div className="text-3xl font-bold text-primary">{stats.approved}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">작성해야 할 리뷰</div>
                        <div className="text-3xl font-bold text-primary">{stats.pending}</div>
                    </div>
                </div>

                <div className="bg-white border border-border rounded-xl overflow-hidden mt-8 shadow-sm">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold text-lg">최근 신청 내역</h3>
                    </div>
                    {applications.length > 0 ? (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">캠페인명</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">플랫폼</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">신청일</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">상태</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id}>
                                        <td className="p-4 text-left border-b border-border text-sm">
                                            <Link href={`/campaigns/${app.campaign_id}`} className="hover:text-primary transition-colors">
                                                {app.campaigns.title}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-left border-b border-border text-sm">{app.campaigns.platform}</td>
                                        <td className="p-4 text-left border-b border-border text-sm">
                                            {new Date(app.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')}
                                        </td>
                                        <td className="p-4 text-left border-b border-border text-sm">{getStatusBadge(app.status)}</td>
                                        <td className="p-4 text-left border-b border-border text-sm">{getStatusNote(app.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            아직 신청한 캠페인이 없습니다.
                        </div>
                    )}
                </div>
            </main>
        </div >
    );
}
