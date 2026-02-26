'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
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
    Megaphone,
    ShoppingBag,
    Calendar
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
import { INFLUENCER_LINKS } from '@/constants/navigation';

interface ApplicationWithCampaign extends Application {
    campaigns: Campaign;
}

type CampaignFilter = 'all' | 'PENDING' | 'SELECTED' | 'REJECTED' | 'COMPLETED';

interface CountRow {
    status: Application['status'];
}

interface RowCellProps {
    row: {
        original: ApplicationWithCampaign;
    };
}

export default function MyCampaignsPage() {
    const { user, profile, isLoading } = useAuthStore();
    const router = useRouter();
    const [applications, setApplications] = useState<ApplicationWithCampaign[]>([]);
    const [filter, setFilter] = useState<CampaignFilter>('all');
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
        SELECTED: 0,
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
    const [extensionModal, setExtensionModal] = useState<{
        isOpen: boolean;
        appId: number;
        campaignTitle: string;
        reason: string;
    }>({
        isOpen: false,
        appId: 0,
        campaignTitle: '',
        reason: ''
    });

    const fetchData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            let query = supabase
                .from('applications')
                .select('*, campaigns(*)')
                .eq('user_id', user.id)
                .neq('status', 'CANCELLED')
                .order('created_at', { ascending: false });

            if (filter === 'SELECTED') {
                query = query.in('status', ['SELECTED', 'APPROVED']);
            } else if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data: applicationsData } = await query;

            if (applicationsData) {
                const apps = applicationsData as ApplicationWithCampaign[];
                setApplications(apps);
            } else {
                setApplications([]);
            }

            // Fetch counts for all statuses
            const { data: countData } = await supabase
                .from('applications')
                .select('status')
                .eq('user_id', user.id)
                .neq('status', 'CANCELLED');

            if (countData) {
                const rows = countData as CountRow[];
                const newCounts = {
                    all: rows.length,
                    PENDING: rows.filter((a) => a.status === 'PENDING').length,
                    SELECTED: rows.filter((a) => a.status === 'SELECTED' || a.status === 'APPROVED').length,
                    REJECTED: rows.filter((a) => a.status === 'REJECTED').length,
                    COMPLETED: rows.filter((a) => a.status === 'COMPLETED').length,
                };
                setCounts(newCounts);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, user]);

    useEffect(() => {
        if (!isLoading && user) {
            const normalizedRole = String(profile?.role || '').toUpperCase();
            if (normalizedRole === 'ADVERTISER') {
                router.replace('/dashboard/advertiser');
                return;
            }
            if (normalizedRole === 'ADMIN' || normalizedRole === 'MASTER' || normalizedRole === 'SUPER_ADMIN') {
                router.replace('/dashboard/admin');
                return;
            }
            fetchData();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [isLoading, user, profile?.role, router, fetchData]);

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

    async function handleConfirmPurchase(applicationId: number) {
        try {
            const now = new Date();
            const deadline = new Date(now);
            deadline.setDate(deadline.getDate() + 7); // 구매 확인 후 1주

            const { error } = await supabase
                .from('applications')
                .update({
                    purchased_at: now.toISOString(),
                    review_deadline: deadline.toISOString()
                })
                .eq('id', applicationId);

            if (error) throw error;

            toast.success('구매 확인이 완료되었습니다. 1주일 이내에 리뷰를 등록해주세요!');
            fetchData();
        } catch (error) {
            console.error('Error confirming purchase:', error);
            toast.error('구매 확인 중 오류가 발생했습니다.');
        }
    }

    async function handleRequestExtension() {
        if (!extensionModal.reason.trim()) {
            toast.error('연장 사유를 입력해주세요.');
            return;
        }

        try {
            const { error } = await supabase
                .from('applications')
                .update({
                    extension_status: 'PENDING',
                    extension_reason: extensionModal.reason
                })
                .eq('id', extensionModal.appId);

            if (error) throw error;

            toast.success('연장 요청이 전송되었습니다.');
            setExtensionModal({ ...extensionModal, isOpen: false, reason: '' });
            fetchData();
        } catch (error) {
            console.error('Error requesting extension:', error);
            toast.error('연장 요청 중 오류가 발생했습니다.');
        }
    }

    const shippingColumn = {
        accessorKey: "tracking_number",
        header: "배송 정보",
        cell: ({ row }: RowCellProps) => {
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
    };

    const columns = [
        ...influencerApplicationColumns,
        ...(filter === 'SELECTED' ? [shippingColumn] : []),
        {
            id: "actions",
            header: "액션",
            cell: ({ row }: RowCellProps) => {
                const app = row.original;
                const isSelected = app.status === 'SELECTED' || app.status === 'APPROVED';
                const isPending = app.status === 'PENDING';

                return (
                    <div className="flex items-center gap-2">
                        {isSelected && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 font-bold gap-1.5 px-3 rounded-xl shadow-sm transition-all active:scale-95"
                                    asChild
                                >
                                    <Link href={`/campaigns/${app.campaign_id}#guide`}>
                                        <ClipboardCheck size={14} className="stroke-[2.5px]" />
                                        <span>가이드 확인</span>
                                    </Link>
                                </Button>
                                
                                {app.campaigns?.type === 'PURCHASE' && !app.purchased_at && (
                                    <Button
                                        size="sm"
                                        className="h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 px-3 rounded-xl shadow-md transition-all active:scale-95"
                                        onClick={() => handleConfirmPurchase(app.id)}
                                    >
                                        <ShoppingBag size={14} className="stroke-[2.5px]" />
                                        <span>구매 확인</span>
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    className="h-9 bg-rose-500 hover:bg-rose-600 text-white font-bold gap-1.5 px-3 rounded-xl shadow-md shadow-rose-100 transition-all active:scale-95"
                                    onClick={() => setReviewModal({
                                        isOpen: true,
                                        appId: app.id,
                                        campaignId: app.campaign_id,
                                        campaignTitle: app.campaigns.title,
                                        creatorId: app.campaigns.created_by
                                    })}
                                >
                                    <Camera size={14} className="stroke-[2.5px]" />
                                    <span>리뷰 등록</span>
                                </Button>
                            </>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 rounded-xl shadow-xl border-slate-100 p-1">
                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                    <Link href={`/campaigns/${app.campaign_id}`} className="flex items-center gap-2 py-2">
                                        <Eye size={14} className="text-slate-500" />
                                        <span className="text-xs font-bold text-slate-600">상세보기</span>
                                    </Link>
                                </DropdownMenuItem>
                                {isPending && (
                                    <DropdownMenuItem
                                        onClick={() => handleCancel(app.id, app.campaigns.title, app.status)}
                                        className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 flex items-center gap-2 py-2"
                                    >
                                        <XCircle size={14} />
                                        <span className="text-xs font-bold">신청 취소</span>
                                    </DropdownMenuItem>
                                )}
                                {isSelected && app.status !== 'COMPLETED' && (
                                    <DropdownMenuSeparator />
                                )}
                                {isSelected && app.status !== 'COMPLETED' && (
                                    <DropdownMenuItem 
                                        onClick={() => setExtensionModal({
                                            isOpen: true,
                                            appId: app.id,
                                            campaignTitle: app.campaigns.title,
                                            reason: ''
                                        })}
                                        className="rounded-lg cursor-pointer text-orange-600 flex items-center gap-2 py-2"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-bold">리뷰 기한 연장 요청</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
                links={INFLUENCER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/influencer/campaigns'
                }))}
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
                        <Tabs
                            defaultValue="all"
                            value={filter}
                            onValueChange={(v) => setFilter(v as CampaignFilter)}
                            className="w-full"
                        >
                            <TabsList className="bg-transparent h-auto p-0 flex-wrap gap-2">
                                {[
                                    { value: 'all', label: '전체', count: counts.all, color: 'bg-gray-500' },
                                    { value: 'PENDING', label: '심사중', count: counts.PENDING, color: 'bg-orange-500' },
                                    { value: 'SELECTED', label: '선정됨', count: counts.SELECTED, color: 'bg-green-500' },
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
                onClose={() => setReviewModal((prev) => ({ ...prev, isOpen: false }))}
                applicationId={reviewModal.appId}
                campaignId={reviewModal.campaignId}
                campaignTitle={reviewModal.campaignTitle}
                creatorId={reviewModal.creatorId}
                onSuccess={fetchData}
            />

            {/* 기한 연장 요청 모달 */}
            {extensionModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                <Calendar size={20} />
                            </div>
                            <h2 className="text-xl font-bold">리뷰 기한 연장 요청</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{extensionModal.campaignTitle}</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">연장 사유</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={extensionModal.reason}
                                    onChange={e => setExtensionModal({ ...extensionModal, reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-sm"
                                    placeholder="예: 상품 배송이 늦어지고 있습니다, 불가피한 사정으로 3일 뒤까지 등록 가능합니다."
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    className="flex-1 bg-primary h-11 font-bold rounded-xl"
                                    onClick={handleRequestExtension}
                                >
                                    요청하기
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-11 font-bold rounded-xl border-gray-200"
                                    onClick={() => setExtensionModal({ ...extensionModal, isOpen: false })}
                                >
                                    취소
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
