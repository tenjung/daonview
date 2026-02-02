'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Application, Campaign } from '@/types/database';
import DashboardSidebar from '@/components/DashboardSidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { 
    MoreHorizontal, 
    Eye, 
    XCircle,
    ClipboardCheck,
    Truck,
    Camera,
    Megaphone
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ReviewSubmitModal from '@/components/influencer/ReviewSubmitModal';
import { DataTable } from '@/components/ui/data-table';
import { influencerApplicationColumns } from '@/components/influencer/influencer-applications-columns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApplicationWithCampaign extends Application {
    campaigns: Campaign;
}

export default function MyCampaignsPage() {
    const { user, profile, isLoading } = useAuthStore();
    const router = useRouter();
    const [applications, setApplications] = useState<ApplicationWithCampaign[]>([]);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('all');
    const [loading, setLoading] = useState(true);
    const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; appId: number; title: string; status: string }>({
        isOpen: false,
        appId: 0,
        title: '',
        status: ''
    });
    const [counts, setCounts] = useState({
        all: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        COMPLETED: 0
    });
    const [reviewModal, setReviewModal] = useState<{
        isOpen: boolean;
        appId: number;
        campaignId: number;
        campaignTitle: string;
        creatorId: string;
    }>({
        isOpen: false,
        appId: 0,
        campaignId: 0,
        campaignTitle: '',
        creatorId: ''
    });

    useEffect(() => {
        if (!isLoading && user) {
            if (profile?.role === 'ADVERTISER') {
                router.replace('/dashboard/advertiser');
                return;
            }
            fetchData();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [isLoading, user, profile, router, filter]);

    async function fetchData() {
        if (!user) return;
        
        try {
            setLoading(true);

            let query = supabase
                .from('applications')
                .select('*, campaigns(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data: applicationsData } = await query;

            if (applicationsData) {
                const apps = applicationsData as ApplicationWithCampaign[];
                setApplications(apps);
                
                // 마감 기한 체크 및 알림 생성 (승인된 캠페인 대상)
                const approvedApps = apps.filter(app => app.status === 'APPROVED');
                for (const app of approvedApps) {
                    if (!app.campaigns?.end_date) continue;
                    
                    const endDate = new Date(app.campaigns.end_date);
                    const now = new Date();
                    const diffTime = endDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    // 마감 3일 이내인 경우
                    if (diffDays <= 3 && diffDays > 0) {
                        const { count } = await supabase
                            .from('notifications')
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', user.id)
                            .eq('type', 'CAMPAIGN_DEADLINE')
                            .ilike('content', `%[${app.campaigns.title}]%`)
                            .gt('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

                        if (count === 0) {
                            await supabase.from('notifications').insert({
                                user_id: user.id,
                                type: 'CAMPAIGN_DEADLINE',
                                title: '⏰ 리뷰 마감 임박 안내',
                                content: `[${app.campaigns.title}] 캠페인 리뷰 마감이 ${diffDays}일 남았습니다!`,
                                link: `/dashboard/influencer/campaigns`
                            });
                        }
                    }
                }
            }

            // Fetch counts for all statuses
            const { data: countData } = await supabase
                .from('applications')
                .select('status')
                .eq('user_id', user.id);

            if (countData) {
                const newCounts = {
                    all: countData.length,
                    PENDING: countData.filter((a: any) => a.status === 'PENDING').length,
                    APPROVED: countData.filter((a: any) => a.status === 'APPROVED').length,
                    REJECTED: countData.filter((a: any) => a.status === 'REJECTED').length,
                    COMPLETED: countData.filter((a: any) => a.status === 'COMPLETED').length,
                };
                setCounts(newCounts);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    }

    async function handleCancel(applicationId: number, campaignTitle: string, status: string) {
        if (status !== 'PENDING') {
            toast.error('심사중인 신청만 취소할 수 있습니다.');
            return;
        }

        setCancelDialog({
            isOpen: true,
            appId: applicationId,
            title: campaignTitle,
            status
        });
    }

    async function confirmCancel() {
        try {
            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('id', cancelDialog.appId);

            if (error) throw error;

            toast.success('신청이 취소되었습니다.');
            fetchData();
        } catch (error) {
            console.error('Error canceling application:', error);
            toast.error('취소 중 오류가 발생했습니다.');
        }
    }

    const columns = [
        ...influencerApplicationColumns,
        {
            accessorKey: "tracking_number",
            header: "배송 정보",
            cell: ({ row }: any) => {
                const app = row.original;
                return app.tracking_number ? (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                            <Truck size={12} />
                            <span>{app.tracking_company}</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">{app.tracking_number}</div>
                    </div>
                ) : (
                    <span className="text-slate-300 text-xs">발송 대기</span>
                );
            }
        },
        {
            id: "actions",
            header: "액션",
            cell: ({ row }: any) => {
                const app = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100 p-1">
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                <Link href={`/campaigns/${app.campaign_id}`} className="flex items-center gap-2 py-2">
                                    <Eye size={14} className="text-slate-500" />
                                    <span>상세보기</span>
                                </Link>
                            </DropdownMenuItem>
                            {app.status === 'APPROVED' && (
                                <>
                                    <DropdownMenuItem className="rounded-lg cursor-pointer flex items-center gap-2 py-2">
                                        <ClipboardCheck size={14} className="text-green-500" />
                                        <span>가이드 확인</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-50" />
                                    <DropdownMenuItem 
                                        className="rounded-lg cursor-pointer flex items-center gap-2 py-2 text-rose-500 font-bold"
                                        onClick={() => setReviewModal({
                                            isOpen: true,
                                            appId: app.id,
                                            campaignId: app.campaign_id,
                                            campaignTitle: app.campaigns.title,
                                            creatorId: app.campaigns.created_by
                                        })}
                                    >
                                        <Camera size={14} />
                                        <span>리뷰 등록</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                            {app.status === 'PENDING' && (
                                <>
                                    <DropdownMenuSeparator className="bg-slate-50" />
                                    <DropdownMenuItem 
                                        onClick={() => handleCancel(app.id, app.campaigns.title, app.status)}
                                        className="rounded-lg cursor-pointer flex items-center gap-2 py-2 text-red-500 focus:text-red-500 focus:bg-red-50"
                                    >
                                        <XCircle size={14} />
                                        <span>신청 취소</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        }
    ];

    if (loading && applications.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-gray-500 font-bold">캠페인 목록을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="INFLUENCER"
                userName={profile?.nickname || '사용자'}
                links={[
                    { href: '/dashboard/influencer', label: '대시보드' },
                    { href: '/dashboard/influencer/campaigns', label: '나의 캠페인', active: true },
                    { href: '/dashboard/influencer/favorites', label: '관심 캠페인' },
                    { 
                        href: '/profile/edit', 
                        label: '계정 설정',
                        subLinks: [
                            { href: '/profile/edit?tab=basic', label: '기본 정보' },
                            { href: '/profile/edit?tab=interests', label: '관심사 설정' }
                        ]
                    },
                    { href: '/contact', label: '1:1 문의' }
                ]}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4 tracking-tight italic">
                                <Megaphone className="w-10 h-10 text-primary" />
                                My Campaigns
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">참여 중인 모든 캠페인의 진행 상태를 확인하세요.</p>
                        </div>
                        <Link 
                            href="/campaigns" 
                            className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all flex items-center gap-2 transform hover:-translate-y-1"
                        >
                            신규 캠페인 찾기
                        </Link>
                    </div>

                    {/* Tabs / Filters */}
                    <div className="mb-8">
                        <Tabs defaultValue="all" value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full">
                            <TabsList className="bg-transparent h-auto p-0 flex-wrap gap-2">
                                {[
                                    { value: 'all', label: '전체', count: counts.all, color: 'bg-gray-500' },
                                    { value: 'PENDING', label: '심사중', count: counts.PENDING, color: 'bg-orange-500' },
                                    { value: 'APPROVED', label: '선정됨', count: counts.APPROVED, color: 'bg-green-500' },
                                    { value: 'REJECTED', label: '미선정', count: counts.REJECTED, color: 'bg-red-500' },
                                    { value: 'COMPLETED', label: '완료', count: counts.COMPLETED, color: 'bg-blue-500' },
                                ].map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className={`
                                            px-6 py-3 rounded-2xl font-bold text-sm border transition-all gap-3
                                            data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-gray-200 data-[state=active]:shadow-md
                                            data-[state=inactive]:bg-white/50 data-[state=inactive]:text-gray-400 data-[state=inactive]:border-transparent hover:bg-white
                                        `}
                                    >
                                        {tab.label}
                                        <Badge className={`${tab.color} text-white border-none text-[10px] px-1.5 py-0`}>
                                            {tab.count}
                                        </Badge>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <DataTable 
                            columns={columns} 
                            data={applications} 
                            isLoading={loading}
                            emptyMessage="선택한 조건의 캠페인이 없습니다."
                        />
                    </div>
                </div>
            </main>

            <ConfirmDialog
                isOpen={cancelDialog.isOpen}
                onClose={() => setCancelDialog({ ...cancelDialog, isOpen: false })}
                onConfirm={confirmCancel}
                title="신청 취소"
                message={`"${cancelDialog.title}" 캠페인 신청을 취소하시겠습니까?\n\n취소 후 다시 신청하실 수 있습니다.`}
                confirmText="취소하기"
                cancelText="돌아가기"
                type="danger"
            />

            <ReviewSubmitModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal((prev: any) => ({ ...prev, isOpen: false }))}
                applicationId={reviewModal.appId}
                campaignId={reviewModal.campaignId}
                campaignTitle={reviewModal.campaignTitle}
                creatorId={reviewModal.creatorId}
                onSuccess={fetchData}
            />
        </div>
    );
}
