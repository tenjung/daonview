'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { Application, Campaign } from '@/types/database';
import DashboardSidebar from '@/components/DashboardSidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { 
    MoreHorizontal, 
    Eye, 
    XCircle,
    ClipboardCheck,
    ChevronDown,
    ExternalLink
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ApplicationWithCampaign extends Application {
    campaigns: Campaign;
}

export default function MyCampaignsPage() {
    const { user, profile, isLoading } = useAuthStore();
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

    useEffect(() => {
        if (!isLoading && user) {
            fetchData();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [isLoading, user, filter]);

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
                setApplications(applicationsData as ApplicationWithCampaign[]);
            }

            // Fetch counts for all statuses
            const { data: countData } = await supabase
                .from('applications')
                .select('status')
                .eq('user_id', user.id);

            if (countData) {
                const newCounts = {
                    all: countData.length,
                    PENDING: countData.filter(a => a.status === 'PENDING').length,
                    APPROVED: countData.filter(a => a.status === 'APPROVED').length,
                    REJECTED: countData.filter(a => a.status === 'REJECTED').length,
                    COMPLETED: countData.filter(a => a.status === 'COMPLETED').length,
                };
                setCounts(newCounts);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-600">심사중</span>;
            case 'APPROVED':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-600">선정됨</span>;
            case 'REJECTED':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-600">미선정</span>;
            case 'COMPLETED':
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-600">완료</span>;
            default:
                return <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-gray-50 text-gray-600">{status}</span>;
        }
    };

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

            toast.success('신청이 취소되었습니다.', {
                description: '언제든지 다시 신청하실 수 있습니다.'
            });
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Error canceling application:', error);
            toast.error('취소 중 오류가 발생했습니다.');
        }
    }

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

            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-text-main">나의 캠페인</h1>
                    <Link href="/campaigns" className="btn btn-primary text-sm px-4 py-2">캠페인 찾아보기</Link>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${filter === 'all' 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>전체</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {counts.all}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${filter === 'PENDING' 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>심사중</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {counts.PENDING}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('APPROVED')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${filter === 'APPROVED' 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>선정됨</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === 'APPROVED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {counts.APPROVED}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('REJECTED')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${filter === 'REJECTED' 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>미선정</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {counts.REJECTED}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('COMPLETED')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${filter === 'COMPLETED' 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>완료</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {counts.COMPLETED}
                        </span>
                    </button>
                </div>

                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                    {applications.length > 0 ? (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">캠페인명</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">플랫폼</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">카테고리</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">신청일</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">상태</th>
                                    <th className="p-4 text-left border-b border-border bg-gray-50 font-semibold text-sm text-gray-500">액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-left border-b border-border text-sm">
                                            <Link href={`/campaigns/${app.campaign_id}`} className="hover:text-primary transition-colors font-medium">
                                                {app.campaigns.title}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-left border-b border-border text-sm">{app.campaigns.platform}</td>
                                        <td className="p-4 text-left border-b border-border text-sm">{app.campaigns.category}</td>
                                        <td className="p-4 text-left border-b border-border text-sm">
                                            {new Date(app.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')}
                                        </td>
                                        <td className="p-4 text-left border-b border-border text-sm">{getStatusBadge(app.status)}</td>
                                        <td className="p-4 text-left border-b border-border text-sm">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                        <span className="sr-only">메뉴 열기</span>
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
                                                        <DropdownMenuItem className="rounded-lg cursor-pointer flex items-center gap-2 py-2">
                                                            <ClipboardCheck size={14} className="text-green-500" />
                                                            <span>가이드 확인</span>
                                                        </DropdownMenuItem>
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-lg mb-2">신청한 캠페인이 없습니다.</p>
                            <Link href="/campaigns" className="text-primary hover:underline">
                                캠페인 둘러보기 →
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* Cancel Confirmation Dialog */}
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
        </div>
    );
}
