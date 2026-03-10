'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Application, Campaign } from '@/types/database';
import DashboardSidebar from '@/components/DashboardSidebar';
import { LayoutDashboard, Megaphone, Clock, ChevronRight } from 'lucide-react';
import { InfluencerStatsCards } from '@/components/influencer/InfluencerStatsCards';
import { INFLUENCER_LINKS } from '@/constants/navigation';
import { DataTable } from '@/components/ui/data-table';
import { influencerApplicationColumns } from '@/components/influencer/influencer-applications-columns';
import { Badge } from '@/components/ui/badge';
import { InfluencerMobileHeader } from '@/components/influencer/InfluencerMobileHeader';
import { InfluencerMobileListCard } from '@/components/influencer/InfluencerMobileListCard';

interface ApplicationWithCampaign extends Application {
    campaigns: Campaign;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: '심사중', color: 'bg-orange-100 text-orange-600' },
    APPROVED: { label: '선정됨', color: 'bg-green-100 text-green-600' },
    SELECTED: { label: '선정됨', color: 'bg-green-100 text-green-600' },
    REJECTED: { label: '미선정', color: 'bg-red-100 text-red-600' },
    COMPLETED: { label: '완료', color: 'bg-blue-100 text-blue-600' },
};

export default function InfluencerDashboard() {
    const { user, profile, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const [applications, setApplications] = useState<ApplicationWithCampaign[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0
    });
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;

        try {
            setIsDataLoading(true);
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
            setIsDataLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user?.id) {
            router.replace('/login?returnTo=/dashboard/influencer');
            return;
        }

        const normalizedRole = String(profile?.role || '').toUpperCase();
        if (normalizedRole === 'ADVERTISER') {
            router.replace('/dashboard/advertiser');
            return;
        }

        if (normalizedRole === 'ADMIN' || normalizedRole === 'MASTER' || normalizedRole === 'SUPER_ADMIN') {
            router.replace('/dashboard/admin');
            return;
        }

        fetchDashboardData();
    }, [authLoading, user?.id, profile?.role, router, fetchDashboardData]);

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-gray-500 font-bold">인사이트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    const formatAppliedDate = (value?: string | null) => {
        if (!value) return '-';
        return new Intl.DateTimeFormat('ko-KR', {
            month: 'numeric',
            day: 'numeric',
        }).format(new Date(value));
    };

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

            <main className="flex-1 overflow-y-auto bg-gray-50/50 px-4 py-5 sm:p-8">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header Section */}
                    <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
                        <InfluencerMobileHeader
                            icon={<LayoutDashboard className="h-5 w-5" />}
                            title="My Activity"
                            subtitle="캠페인 활동과 리뷰 현황을 한눈에 관리하세요."
                            action={
                                <Link
                                    href="/campaigns"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-lg"
                                >
                                    <Megaphone size={16} />
                                    찾아보기
                                </Link>
                            }
                        />
                        <div className="hidden sm:block">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                                    <LayoutDashboard className="w-10 h-10 text-primary" />
                                    My Activity
                                </h1>
                                <p className="text-gray-500 mt-2 font-medium">캠페인 활동과 리뷰 현황을 한눈에 관리하세요.</p>
                            </div>
                        </div>
                        <Link
                            href="/campaigns"
                            className="hidden sm:inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-4 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-lg sm:self-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base sm:shadow-lg sm:hover:-translate-y-1 sm:active:translate-y-0"
                        >
                            <Megaphone size={16} className="sm:h-5 sm:w-5" /> 캠페인 찾아보기
                        </Link>
                    </div>

                    {/* Stats Cards Section */}
                    <InfluencerStatsCards stats={stats} />

                    {errorMessage && (
                        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
                            <p className="text-sm font-semibold text-rose-700">{errorMessage}</p>
                        </div>
                    )}

                    {/* Recent Activity Section */}
                    <div className="mt-8 sm:mt-12">
                        <div className="mb-4 flex items-center justify-between sm:mb-8">
                            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                                <Clock className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                                최근 신청 내역
                            </h2>
                            <Link
                                href="/dashboard/influencer/campaigns"
                                className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 transition-colors hover:text-gray-900"
                            >
                                전체 내역 보기 <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-8">
                            <div className="sm:hidden">
                                {isDataLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                    </div>
                                ) : applications.length > 0 ? (
                                    <div className="space-y-3">
                                        {applications.map((application) => {
                                            const campaign = application.campaigns;
                                            const normalizedStatus = String(application.status || '').toUpperCase();
                                            const status = statusConfig[normalizedStatus] || { label: application.status, color: 'bg-gray-100 text-gray-600' };

                                            return (
                                                <InfluencerMobileListCard
                                                    key={application.id}
                                                    href={`/campaigns/${campaign?.id}`}
                                                    thumbnail={
                                                        campaign?.thumbnail_url ? (
                                                            <img
                                                                src={campaign.thumbnail_url}
                                                                alt={campaign.title}
                                                                className="h-14 w-14 rounded-2xl object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-xs font-bold text-gray-400">
                                                                없음
                                                            </div>
                                                        )
                                                    }
                                                    title={campaign?.title || '캠페인'}
                                                    badge={<Badge className={`${status.color} shrink-0 border-none font-bold`}>{status.label}</Badge>}
                                                    meta={
                                                        <>
                                                            <span>{campaign?.platform || '-'}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span>{formatAppliedDate(application.created_at)}</span>
                                                        </>
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                                        아직 신청한 캠페인이 없습니다.
                                    </div>
                                )}
                            </div>

                            <div className="hidden sm:block">
                                <DataTable
                                    columns={influencerApplicationColumns}
                                    data={applications}
                                    isLoading={isDataLoading}
                                    emptyMessage="아직 신청한 캠페인이 없습니다."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Empty State Suggestion */}
                    {applications.length === 0 && !isDataLoading && (
                        <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center sm:mt-12 sm:p-12">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 sm:mb-6 sm:h-20 sm:w-20">
                                <Megaphone className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:text-xl">새로운 캠페인을 시작해보세요!</h3>
                            <p className="mx-auto mb-6 max-w-md text-sm text-gray-500 sm:mb-8 sm:text-base">전국 팔도의 다양한 캠페인들이 인플루언서님의 참여를 기다리고 있습니다.</p>
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
