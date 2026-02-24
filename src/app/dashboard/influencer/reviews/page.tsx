'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import ReviewSubmitModal from '@/components/influencer/ReviewSubmitModal';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { INFLUENCER_LINKS } from '@/constants/navigation';
import { Campaign } from '@/types/database';
import { Camera, ExternalLink, MessageSquare } from 'lucide-react';

type CampaignLite = Pick<Campaign, 'id' | 'title' | 'platform' | 'type' | 'end_date'> & {
    created_by?: string;
};

interface PendingReviewQueryRow {
    id: number;
    status: string | null;
    created_at: string;
    campaign_id: number;
    review_deadline: string | null;
    purchased_at: string | null;
    campaigns: CampaignLite | CampaignLite[] | null;
}

interface PendingReviewApplication {
    id: number;
    status: string | null;
    created_at: string;
    campaign_id: number;
    review_deadline: string | null;
    purchased_at: string | null;
    campaigns: CampaignLite | null;
}

interface SubmittedReviewRow {
    id: number;
    campaign_id: number;
    post_url: string;
    created_at: string;
    status: string;
    platform?: string | null;
    campaigns?: CampaignLite | null;
}

interface SubmittedReviewQueryRow {
    id: number;
    campaign_id: number;
    post_url: string;
    created_at: string;
    status: string;
    platform?: string | null;
    campaigns?: CampaignLite | CampaignLite[] | null;
}

type ReviewTab = 'PENDING' | 'SUBMITTED';

export default function InfluencerReviewsPage() {
    const { user, profile, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ReviewTab>('PENDING');
    const [loading, setLoading] = useState(true);
    const [pendingReviews, setPendingReviews] = useState<PendingReviewApplication[]>([]);
    const [submittedReviews, setSubmittedReviews] = useState<SubmittedReviewRow[]>([]);
    const [reviewModal, setReviewModal] = useState<{
        isOpen: boolean;
        applicationId: number;
        campaignId: number;
        campaignTitle: string;
        creatorId: string;
        isPurchaseExperience: boolean;
    }>({
        isOpen: false,
        applicationId: 0,
        campaignId: 0,
        campaignTitle: '',
        creatorId: '',
        isPurchaseExperience: false,
    });

    const normalizeCampaign = (campaigns: CampaignLite | CampaignLite[] | null | undefined): CampaignLite | null => {
        if (!campaigns) return null;
        if (Array.isArray(campaigns)) return campaigns[0] || null;
        return campaigns;
    };

    const fetchReviewData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [{ data: pendingData, error: pendingError }, { data: submittedData, error: submittedError }] = await Promise.all([
                supabase
                    .from('applications')
                    .select('id, status, created_at, campaign_id, review_deadline, purchased_at, campaigns(id, title, platform, type, end_date, created_by)')
                    .eq('user_id', user.id)
                    .in('status', ['SELECTED', 'APPROVED'])
                    .or('review_submitted.is.null,review_submitted.eq.false')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('reviews')
                    .select('id, campaign_id, post_url, created_at, status, platform, campaigns(id, title, platform, type, end_date)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
            ]);

            if (pendingError) throw pendingError;
            if (submittedError) throw submittedError;

            const pendingRows: PendingReviewApplication[] = ((pendingData || []) as PendingReviewQueryRow[]).map((row) => ({
                id: row.id,
                status: row.status,
                created_at: row.created_at,
                campaign_id: row.campaign_id,
                review_deadline: row.review_deadline,
                purchased_at: row.purchased_at,
                campaigns: normalizeCampaign(row.campaigns),
            }));
            setPendingReviews(pendingRows);
            const submittedRows: SubmittedReviewRow[] = ((submittedData || []) as SubmittedReviewQueryRow[]).map((row) => ({
                id: row.id,
                campaign_id: row.campaign_id,
                post_url: row.post_url,
                created_at: row.created_at,
                status: row.status,
                platform: row.platform,
                campaigns: normalizeCampaign(row.campaigns),
            }));
            setSubmittedReviews(submittedRows);

            if (pendingRows.length > 0) {
                const { count: existingTodoCount, error: countError } = await supabase
                    .from('notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('type', 'CAMPAIGN_REVIEW_TODO')
                    .eq('is_read', false)
                    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

                if (!countError && (existingTodoCount || 0) === 0) {
                    await supabase.from('notifications').insert({
                        user_id: user.id,
                        type: 'CAMPAIGN_REVIEW_TODO',
                        title: '📝 작성해야 할 리뷰가 있어요',
                        content: `현재 ${pendingRows.length}개의 리뷰를 작성해야 합니다.`,
                        link: '/dashboard/influencer/reviews'
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching influencer reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;

        const normalizedRole = String(profile?.role || '').toUpperCase();
        if (!user) {
            setLoading(false);
            router.replace('/login?returnTo=/dashboard/influencer/reviews');
            return;
        }

        if (normalizedRole === 'ADVERTISER') {
            router.replace('/dashboard/advertiser');
            return;
        }

        if (normalizedRole === 'ADMIN' || normalizedRole === 'MASTER' || normalizedRole === 'SUPER_ADMIN') {
            router.replace('/dashboard/admin');
            return;
        }

        fetchReviewData();
    }, [authLoading, user, profile?.role, router, fetchReviewData]);

    const pendingColumns = useMemo<ColumnDef<PendingReviewApplication>[]>(() => [
        {
            id: 'campaign',
            header: '캠페인 정보',
            cell: ({ row }) => {
                const campaign = row.original.campaigns;
                return (
                    <Link href={`/campaigns/${row.original.campaign_id}`} className="font-bold text-slate-900 hover:text-primary transition-colors">
                        {campaign?.title || '제목 없음'}
                    </Link>
                );
            }
        },
        {
            id: 'platform',
            header: '플랫폼',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-medium">
                    {String(row.original.campaigns?.platform || 'UNKNOWN').toUpperCase()}
                </Badge>
            )
        },
        {
            id: 'deadline',
            header: '리뷰 마감일',
            cell: ({ row }) => {
                const rawDate = row.original.review_deadline || row.original.campaigns?.end_date;
                if (!rawDate) return <span className="text-xs text-slate-400">미정</span>;
                return <span className="text-sm font-semibold">{new Date(rawDate).toLocaleDateString('ko-KR')}</span>;
            }
        },
        {
            id: 'status',
            header: '상태',
            cell: () => (
                <Badge className="bg-amber-100 text-amber-700 border-none font-bold">작성 필요</Badge>
            )
        },
        {
            id: 'actions',
            header: '액션',
            cell: ({ row }) => {
                const application = row.original;
                const campaign = application.campaigns;
                return (
                    <Button
                        size="sm"
                        className="h-9 bg-rose-500 hover:bg-rose-600 text-white font-bold gap-1.5 px-3 rounded-xl shadow-md shadow-rose-100 transition-all"
                        onClick={() => setReviewModal({
                            isOpen: true,
                            applicationId: application.id,
                            campaignId: application.campaign_id,
                            campaignTitle: campaign?.title || '캠페인',
                            creatorId: String(campaign?.created_by || ''),
                            isPurchaseExperience: String(campaign?.type || '').toUpperCase() === 'PURCHASE',
                        })}
                    >
                        <Camera size={14} />
                        <span>리뷰 등록</span>
                    </Button>
                );
            }
        }
    ], []);

    const submittedColumns = useMemo<ColumnDef<SubmittedReviewRow>[]>(() => [
        {
            id: 'campaign',
            header: '캠페인 정보',
            cell: ({ row }) => (
                <span className="font-bold text-slate-900">{row.original.campaigns?.title || `캠페인 #${row.original.campaign_id}`}</span>
            )
        },
        {
            id: 'postUrl',
            header: '리뷰 URL',
            cell: ({ row }) => {
                const postUrl = String(row.original.post_url || '').trim();
                const isLink = postUrl.startsWith('http://') || postUrl.startsWith('https://');
                if (!postUrl || postUrl === 'PURCHASE_PROOF' || !isLink) {
                    return <span className="text-xs font-bold text-slate-500">증빙 제출</span>;
                }

                return (
                    <a
                        href={postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                    >
                        링크 열기 <ExternalLink size={13} />
                    </a>
                );
            }
        },
        {
            id: 'submittedAt',
            header: '제출일',
            cell: ({ row }) => <span className="text-sm font-semibold">{new Date(row.original.created_at).toLocaleDateString('ko-KR')}</span>
        },
        {
            id: 'reviewStatus',
            header: '검수 상태',
            cell: ({ row }) => {
                const status = String(row.original.status || '').toUpperCase();
                if (status === 'APPROVED') return <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">승인됨</Badge>;
                if (status === 'REJECTED') return <Badge className="bg-rose-100 text-rose-700 border-none font-bold">반려됨</Badge>;
                return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">검수중</Badge>;
            }
        }
    ], []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-gray-500 font-bold">리뷰 데이터를 불러오는 중...</p>
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
                    active: link.href === '/dashboard/influencer/reviews'
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <MessageSquare className="w-9 h-9 text-primary" />
                                나의 리뷰
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">작성해야 할 리뷰와 제출 이력을 한 곳에서 확인하세요.</p>
                        </div>
                        <Link
                            href="/dashboard/influencer/campaigns"
                            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-black transition-all"
                        >
                            나의 캠페인
                        </Link>
                    </div>

                    <div className="mb-6">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReviewTab)}>
                            <TabsList className="bg-gray-100/70 p-1 h-auto rounded-2xl">
                                <TabsTrigger value="PENDING" className="px-5 py-2.5 rounded-xl font-bold">
                                    작성 필요 <Badge className="ml-2 bg-amber-500 text-white border-none">{pendingReviews.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="SUBMITTED" className="px-5 py-2.5 rounded-xl font-bold">
                                    제출 완료 <Badge className="ml-2 bg-slate-500 text-white border-none">{submittedReviews.length}</Badge>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        {activeTab === 'PENDING' ? (
                            <DataTable
                                columns={pendingColumns}
                                data={pendingReviews}
                                isLoading={false}
                                emptyMessage="현재 작성해야 할 리뷰가 없습니다."
                            />
                        ) : (
                            <DataTable
                                columns={submittedColumns}
                                data={submittedReviews}
                                isLoading={false}
                                emptyMessage="아직 제출한 리뷰가 없습니다."
                            />
                        )}
                    </div>
                </div>
            </main>

            <ReviewSubmitModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal((prev) => ({ ...prev, isOpen: false }))}
                applicationId={reviewModal.applicationId}
                campaignId={reviewModal.campaignId}
                campaignTitle={reviewModal.campaignTitle}
                creatorId={reviewModal.creatorId}
                isPurchaseExperience={reviewModal.isPurchaseExperience}
                onSuccess={fetchReviewData}
            />
        </div>
    );
}
