'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Application, Campaign } from '@/types/database';
import DashboardSidebar from '@/components/DashboardSidebar';
import { LayoutDashboard, Megaphone, Clock } from 'lucide-react';
import { InfluencerStatsCards } from '@/components/influencer/InfluencerStatsCards';
import { INFLUENCER_LINKS } from '@/constants/navigation';
import { DataTable } from '@/components/ui/data-table';
import { influencerApplicationColumns } from '@/components/influencer/influencer-applications-columns';
import { Button } from '@/components/ui/button';

interface ApplicationWithCampaign extends Application {
    campaigns: Campaign;
}

export default function InfluencerDashboard() {
    const { user, profile, isInitialized } = useAuthStore();
    const router = useRouter();
    const [applications, setApplications] = useState<ApplicationWithCampaign[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0
    });
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setErrorMessage(null);

            // Fetch applications with campaign details
            const { data: applicationsData, error: applicationsError } = await supabase
                .from('applications')
                .select('*, campaigns(*)')
                .eq('user_id', user.id)
                .neq('status', 'CANCELLED')
                .order('created_at', { ascending: false })
                .limit(10);

            if (applicationsError) {
                throw applicationsError;
            }

            if (applicationsData) {
                setApplications(applicationsData as ApplicationWithCampaign[]);

                // Calculate stats
                const total = applicationsData.length;
                const approved = applicationsData.filter(app => app.status?.toUpperCase() === 'APPROVED').length;
                const needsReview = applicationsData.filter(app => app.status?.toUpperCase() === 'APPROVED').length;

                setStats({ total, approved, pending: needsReview });
            } else {
                setApplications([]);
                setStats({ total: 0, approved: 0, pending: 0 });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setErrorMessage('대시보드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        if (!user?.id) {
            setLoading(false);
            router.replace('/login?returnTo=/dashboard/influencer');
            return;
        }

        const normalizedRole = String(profile?.role || '').toUpperCase();
        if (normalizedRole === 'ADVERTISER') {
            setLoading(false);
            router.replace('/dashboard/advertiser');
            return;
        }

        if (normalizedRole === 'ADMIN' || normalizedRole === 'MASTER' || normalizedRole === 'SUPER_ADMIN') {
            setLoading(false);
            router.replace('/dashboard/admin');
            return;
        }

        fetchDashboardData();
    }, [isInitialized, user?.id, profile?.role, router, fetchDashboardData]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-gray-500 font-bold">인사이트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="INFLUENCER"
                userName={profile?.nickname || '사용자'}
                links={INFLUENCER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/influencer'
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                                <LayoutDashboard className="w-10 h-10 text-primary" />
                                My Activity
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">캠페인 활동과 리뷰 현황을 한눈에 관리하세요.</p>
                        </div>
                        <Link
                            href="/campaigns"
                            className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-3"
                        >
                            <Megaphone size={20} /> 캠페인 찾아보기
                        </Link>
                    </div>

                    {/* Stats Cards Section */}
                    <InfluencerStatsCards stats={stats} />

                    {errorMessage && (
                        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <p className="text-sm font-semibold text-rose-700">{errorMessage}</p>
                            <Button
                                type="button"
                                onClick={fetchDashboardData}
                                className="h-9 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl"
                            >
                                다시 시도
                            </Button>
                        </div>
                    )}

                    {/* Recent Activity Section */}
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" />
                                최근 신청 내역
                            </h2>
                            <Link
                                href="/dashboard/influencer/campaigns"
                                className="text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm"
                            >
                                전체 내역 보기 →
                            </Link>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <DataTable
                                columns={influencerApplicationColumns}
                                data={applications}
                                isLoading={loading}
                                emptyMessage="아직 신청한 캠페인이 없습니다."
                            />
                        </div>
                    </div>

                    {/* Empty State Suggestion */}
                    {applications.length === 0 && !loading && (
                        <div className="mt-12 p-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Megaphone className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">새로운 캠페인을 시작해보세요!</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">전국 팔도의 다양한 캠페인들이 인플루언서님의 참여를 기다리고 있습니다.</p>
                            <Link
                                href="/campaigns"
                                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                            >
                                추천 캠페인 보러가기 →
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
