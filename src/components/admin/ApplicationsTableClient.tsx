'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Users, Clock, CheckCircle, XCircle, Download, Truck } from 'lucide-react';
import { Application, InfluencerReview } from '@/types/database';
import { DataTable } from '@/components/ui/data-table';
import { StatsCards, StatCard } from '@/components/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { createApplicationColumns } from './applications-columns';
import ConfirmDialog from '@/components/ConfirmDialog';
import InfluencerReviewModal from './InfluencerReviewModal';
import BulkActionsBar from './BulkActionsBar';
import CancellationModal from './CancellationModal';
import * as XLSX from 'xlsx';
import { sendInfluencerSelectedAlimtalk, sendShippingStartedAlimtalk } from '@/lib/alimtalk';

import { RATING_TAGS, SatisfactionLevel } from '@/types/review';

interface ApplicationsTableClientProps {
    initialApplications: Application[];
    campaignId: string;
    campaignTitle: string;
    campaignCategory?: string;
    campaignType?: string;
    recruitCount: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

import ReputationDetailModal from './ReputationDetailModal';

export default function ApplicationsTableClient({
    initialApplications,
    campaignId,
    campaignTitle,
    campaignCategory,
    campaignType,
    recruitCount
}: ApplicationsTableClientProps) {
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedApplications, setSelectedApplications] = useState<Application[]>([]);
    const [reviewModal, setReviewModal] = useState<{
        isOpen: boolean;
        influencerId: string;
        influencerName: string;
    }>({
        isOpen: false,
        influencerId: '',
        influencerName: ''
    });
    const [reputationModal, setReputationModal] = useState<{
        isOpen: boolean;
        influencerId: string;
        influencerName: string;
    }>({
        isOpen: false,
        influencerId: '',
        influencerName: ''
    });
    const [trackingModal, setTrackingModal] = useState<{
        isOpen: boolean;
        appId: number;
        company: string;
        number: string;
    }>({
        isOpen: false,
        appId: 0,
        company: '',
        number: ''
    });

    const [influencerStats, setInfluencerStats] = useState<Map<string, {
        tags: string[];
        cancellations: number;
        satisfaction: SatisfactionLevel[];
    }>>(new Map());
    const [reviewedInfluencerIds, setReviewedInfluencerIds] = useState<Set<string>>(new Set());

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'info' | 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });
    const [cancellationModal, setCancellationModal] = useState<{
        isOpen: boolean;
        applicationId: number | null;
        influencerName: string;
    }>({
        isOpen: false,
        applicationId: null,
        influencerName: ''
    });

    // initialApplications가 변경될 때마다 applications 상태 업데이트
    useEffect(() => {
        setApplications(initialApplications);
        loadInfluencerReviews();
    }, [initialApplications]);

    // 인플루언서 데이터 로드 (평가 및 취소 이력)
    const loadInfluencerReviews = async () => {
        const influencerIds = initialApplications.map(app => app.user_id).filter(Boolean);
        if (influencerIds.length === 0) return;

        try {
            // 1. 인플루언서 평가(리뷰) 가져오기
            const { data: reviewsData } = await supabase
                .from('influencer_reviews')
                .select('influencer_id, rating_tags, satisfaction')
                .in('influencer_id', influencerIds);

            // 2. 과거 취소 이력 가져오기
            const { data: cancelData } = await supabase
                .from('applications')
                .select('user_id')
                .in('user_id', influencerIds)
                .eq('status', 'CANCELLED');

            const statsMap = new Map<string, {
                tags: string[];
                cancellations: number;
                satisfaction: SatisfactionLevel[];
            }>();

            // 요약 데이터 구성
            influencerIds.forEach(id => {
                const reviews = reviewsData?.filter(r => r.influencer_id === id) || [];
                const cancels = cancelData?.filter(c => c.user_id === id).length || 0;

                statsMap.set(id, {
                    tags: reviews.flatMap(r => r.rating_tags),
                    cancellations: cancels,
                    satisfaction: reviews.map(r => r.satisfaction).filter(Boolean) as SatisfactionLevel[]
                });
            });

            setInfluencerStats(statsMap);

            // 3. 현재 캠페인에 대해 평가 완료된 인플루언서 확인
            const { data: currentReviews } = await supabase
                .from('influencer_reviews')
                .select('influencer_id')
                .eq('campaign_id', campaignId);

            if (currentReviews) {
                setReviewedInfluencerIds(new Set(currentReviews.map(r => r.influencer_id)));
            }
        } catch (error) {
            console.error('Error loading influencer stats:', error);
        }
    };

    // 필터링된 신청자 목록
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            if (filter === 'all') return true;
            return app.status?.toUpperCase() === filter.toUpperCase();
        });
    }, [applications, filter]);

    // 통계 계산
    const stats: StatCard[] = useMemo(() => {
        const total = applications.length;
        const pending = applications.filter(app => app.status?.toUpperCase() === 'PENDING').length;
        const approved = applications.filter(app => app.status?.toUpperCase() === 'APPROVED').length;
        const rejected = applications.filter(app => app.status?.toUpperCase() === 'REJECTED').length;
        const cancelled = applications.filter(app => app.status?.toUpperCase() === 'CANCELLED').length;

        return [
            {
                title: '총 신청자',
                value: `${total}명`,
                icon: Users,
                description: (
                    <div className="flex items-center gap-1">
                        <span>모집 인원:</span>
                        {recruitCount >= 999 ? (
                            <span className="text-indigo-600 font-black">∞</span>
                        ) : (
                            <span>{recruitCount}명</span>
                        )}
                    </div>
                )
            },
            {
                title: '대기중',
                value: `${pending}명`,
                icon: Clock,
            },
            {
                title: '승인됨',
                value: `${approved}명`,
                icon: CheckCircle,
            },
            {
                title: '거절/취소',
                value: `${rejected + cancelled}명`,
                icon: XCircle,
            },
        ];
    }, [applications, recruitCount]);

    // 승인 처리
    const handleApprove = async (id: number, name: string, email: string) => {
        setConfirmModal({
            isOpen: true,
            title: '신청 승인',
            message: `${name}님의 신청을 승인하시겠습니까?`,
            type: 'info',
            onConfirm: async () => {
                const now = new Date();
                let updateData: any = {
                    status: 'APPROVED',
                    selected_at: now.toISOString()
                };

                // 방문형(VISIT) 캠페인인 경우 선정일로부터 14일 마감 설정
                if (campaignCategory === 'VISIT') {
                    const deadline = new Date(now);
                    deadline.setDate(deadline.getDate() + 14);
                    updateData.review_deadline = deadline.toISOString();
                }

                const { error } = await supabase
                    .from('applications')
                    .update(updateData)
                    .eq('id', id);

                if (error) {
                    toast.error('승인 처리 중 오류가 발생했습니다.');
                    return;
                }

                // 알림톡 발송 (연락처 체크)
                const app = applications.find(a => a.id === id);
                if (app?.user?.phone_number) {
                    try {
                        await sendInfluencerSelectedAlimtalk(
                            app.user.phone_number,
                            name,
                            campaignTitle,
                            parseInt(campaignId)
                        );
                    } catch (err) {
                        console.error('Alimtalk send error:', err);
                    }
                }

                // 이메일 발송
                if (email) {
                    try {
                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: email,
                                type: 'CAMPAIGN_SELECTED',
                                params: {
                                    nickname: name,
                                    campaignTitle: campaignTitle,
                                    email: email
                                }
                            })
                        });
                    } catch (err) {
                        console.error('Email send error:', err);
                    }
                }

                setApplications(prev =>
                    prev.map(app => app.id === id ? { ...app, status: 'APPROVED' } : app)
                );
                toast.success(`${name}님의 신청이 승인되었습니다.`);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // 거절 처리
    const handleReject = async (id: number, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: '신청 거절',
            message: `${name}님의 신청을 거절하시겠습니까?`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('applications')
                    .update({ status: 'REJECTED' })
                    .eq('id', id);

                if (error) {
                    toast.error('거절 처리 중 오류가 발생했습니다.');
                    return;
                }

                setApplications(prev =>
                    prev.map(app => app.id === id ? { ...app, status: 'REJECTED' } : app)
                );
                toast.success(`${name}님의 신청이 거절되었습니다.`);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // 선정 취소 처리 모달 열기
    const handleCancel = (id: number, name: string) => {
        setCancellationModal({
            isOpen: true,
            applicationId: id,
            influencerName: name
        });
    };

    // 선정 취소 확정 처리
    const handleConfirmCancel = async (reason: string) => {
        if (!cancellationModal.applicationId) return;

        const { error } = await supabase
            .from('applications')
            .update({
                status: 'CANCELLED',
                cancellation_reason: reason,
                cancelled_at: new Date().toISOString()
            })
            .eq('id', cancellationModal.applicationId);

        if (error) {
            toast.error('취소 처리 중 오류가 발생했습니다.');
            return;
        }

        setApplications(prev =>
            prev.map(app => app.id === cancellationModal.applicationId ? { ...app, status: 'CANCELLED', cancellation_reason: reason } : app)
        );
        toast.success(`${cancellationModal.influencerName}님의 선정이 취소되었습니다.`);
        setCancellationModal(prev => ({ ...prev, isOpen: false, applicationId: null }));
    };

    // 평가 모달 열기
    const handleOpenReview = (userId: string, name: string) => {
        setReviewModal({
            isOpen: true,
            influencerId: userId,
            influencerName: name
        });
    };

    // 평판 정보 모달 열기
    const handleOpenReputation = (userId: string, name: string) => {
        setReputationModal({
            isOpen: true,
            influencerId: userId,
            influencerName: name
        });
    };

    // 일괄 승인
    const handleBulkApprove = async () => {
        const ids = selectedApplications.map(app => app.id);
        if (ids.length === 0) return;

        const { error } = await supabase
            .from('applications')
            .update({ status: 'APPROVED' })
            .in('id', ids);

        if (error) {
            toast.error('일괄 승인 중 오류가 발생했습니다.');
            return;
        }

        // 일괄 알림톡 및 이메일 발송
        for (const app of selectedApplications) {
            const userName = app.user?.nickname || app.user?.name || '인플루언서';

            // 알림톡 발송
            if (app.user?.phone_number) {
                try {
                    await sendInfluencerSelectedAlimtalk(
                        app.user.phone_number,
                        userName,
                        campaignTitle,
                        parseInt(campaignId)
                    );
                } catch (err) {
                    console.error(`Alimtalk send error for app ${app.id}:`, err);
                }
            }

            // 이메일 발송
            if (app.user?.email) {
                try {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: app.user.email,
                            type: 'CAMPAIGN_SELECTED',
                            params: {
                                nickname: userName,
                                campaignTitle: campaignTitle,
                                email: app.user.email
                            }
                        })
                    });
                } catch (err) {
                    console.error(`Email send error for app ${app.id}:`, err);
                }
            }
        }

        setApplications(prev =>
            prev.map(app => ids.includes(app.id) ? { ...app, status: 'APPROVED' } : app)
        );
        toast.success(`${ids.length}개의 신청이 승인되었습니다.`);
        setSelectedApplications([]);
    };

    // 일괄 거절
    const handleBulkReject = async () => {
        const ids = selectedApplications.map(app => app.id);
        if (ids.length === 0) return;

        const { error } = await supabase
            .from('applications')
            .update({ status: 'REJECTED' })
            .in('id', ids);

        if (error) {
            toast.error('일괄 거절 중 오류가 발생했습니다.');
            return;
        }

        setApplications(prev =>
            prev.map(app => ids.includes(app.id) ? { ...app, status: 'REJECTED' } : app)
        );
        toast.success(`${ids.length}개의 신청이 거절되었습니다.`);
        setSelectedApplications([]);
    };

    // 운송장 정보 업데이트
    const handleUpdateTracking = (id: number, company: string, number: string) => {
        setTrackingModal({
            isOpen: true,
            appId: id,
            company,
            number
        });
    };

    const handleTrackingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const now = new Date();
            const deadline = new Date(now);
            deadline.setDate(deadline.getDate() + 7); // 배송 시작 후 1주

            const { error } = await supabase
                .from('applications')
                .update({
                    tracking_company: trackingModal.company,
                    tracking_number: trackingModal.number,
                    shipped_at: now.toISOString(),
                    review_deadline: deadline.toISOString()
                })
                .eq('id', trackingModal.appId);

            if (error) throw error;

            toast.success('운송장 정보가 업데이트되었습니다.');

            // 알림톡 발송
            const app = applications.find(a => a.id === trackingModal.appId);
            if (app?.user?.phone_number) {
                await sendShippingStartedAlimtalk(
                    app.user.phone_number,
                    app.user?.nickname || app.user?.name || '인플루언서',
                    campaignTitle,
                    trackingModal.company,
                    trackingModal.number
                );
            }

            setApplications(prev => prev.map(a =>
                a.id === trackingModal.appId
                    ? { ...a, tracking_company: trackingModal.company, tracking_number: trackingModal.number, review_deadline: deadline.toISOString() }
                    : a
            ));
            setTrackingModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error('Tracking update error:', error);
            toast.error('운송장 업데이트 중 오류가 발생했습니다.');
        }
    };

    // 연장 요청 처리
    const handleExtension = async (id: number, action: 'APPROVED' | 'REJECTED') => {
        try {
            const app = applications.find(a => a.id === id);
            let updateData: any = { extension_status: action };

            if (action === 'APPROVED' && app?.review_deadline) {
                const currentDeadline = new Date(app.review_deadline);
                currentDeadline.setDate(currentDeadline.getDate() + 7);
                updateData.review_deadline = currentDeadline.toISOString();
            }

            const { error } = await supabase
                .from('applications')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            toast.success(action === 'APPROVED' ? '연장 승인되었습니다.' : '연장 거절되었습니다.');
            setApplications(prev => prev.map(a =>
                a.id === id
                    ? { ...a, extension_status: action, review_deadline: updateData.review_deadline || a.review_deadline }
                    : a
            ));
        } catch (error) {
            console.error('Extension handling error:', error);
            toast.error('처리 중 오류가 발생했습니다.');
        }
    };

    // Excel 내보내기
    const handleExportExcel = () => {
        const exportData = filteredApplications.map(app => ({
            '신청일시': new Date(app.created_at).toLocaleString('ko-KR'),
            '이름': app.user?.nickname || '',
            '이메일': app.user?.email || '',
            '전화번호': app.user?.phone_number || '',
            'SNS': app.user?.sns_url || '',
            '신청 옵션': app.selected_option || '',
            '신청메시지': app.application_message || '',
            '택배사': app.tracking_company || '',
            '송장번호': app.tracking_number || '',
            '상태': app.status || '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '신청자 목록');
        XLSX.writeFile(wb, `${campaignTitle}_신청자_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel 파일이 다운로드되었습니다.');
    };

    // 컬럼 정의
    const columns = useMemo(() => createApplicationColumns({
        onApprove: handleApprove,
        onReject: handleReject,
        onCancel: handleCancel,
        onOpenReview: handleOpenReview,
        onOpenReputation: handleOpenReputation,
        onUpdateTracking: handleUpdateTracking,
        onHandleExtension: handleExtension,
        influencerStats: influencerStats,
        reviewedInfluencerIds: reviewedInfluencerIds,
        campaignType: campaignType,
    }), [influencerStats, reviewedInfluencerIds, applications, campaignType]);

    // 필터별 개수
    const filterCounts = useMemo(() => ({
        all: applications.length,
        pending: applications.filter(app => app.status?.toUpperCase() === 'PENDING').length,
        approved: applications.filter(app => app.status?.toUpperCase() === 'APPROVED').length,
        rejected: applications.filter(app => app.status?.toUpperCase() === 'REJECTED').length,
        cancelled: applications.filter(app => app.status?.toUpperCase() === 'CANCELLED').length,
    }), [applications]);

    return (
        <div className="space-y-6">
            {/* 통계 카드 */}
            <StatsCards stats={stats} />

            {/* 필터 탭 & 액션 버튼 */}
            <div className="flex items-center justify-between">
                <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                    <TabsList>
                        <TabsTrigger value="all">전체 {filterCounts.all}</TabsTrigger>
                        <TabsTrigger value="pending">대기중 {filterCounts.pending}</TabsTrigger>
                        <TabsTrigger value="approved">승인됨 {filterCounts.approved}</TabsTrigger>
                        <TabsTrigger value="rejected">거절됨 {filterCounts.rejected}</TabsTrigger>
                        <TabsTrigger value="cancelled">취소됨 {filterCounts.cancelled}</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button onClick={handleExportExcel} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Excel 다운로드
                </Button>
            </div>

            {/* 일괄 작업 바 */}
            {selectedApplications.length > 0 && (
                <BulkActionsBar
                    selectedCount={selectedApplications.length}
                    onApprove={handleBulkApprove}
                    onReject={handleBulkReject}
                    onExport={handleExportExcel}
                    onClear={() => setSelectedApplications([])}
                />
            )}

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredApplications}
                enableRowSelection={true}
                onRowSelectionChange={setSelectedApplications}
                pageSize={10}
                emptyMessage="신청자가 없습니다."
            />

            {/* 확인 다이얼로그 */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />

            {/* 평가 모달 */}
            <InfluencerReviewModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
                influencerId={reviewModal.influencerId}
                influencerName={reviewModal.influencerName}
                campaignId={campaignId}
                onReviewSubmitted={loadInfluencerReviews}
            />

            {/* 선정 취소 모달 */}
            <CancellationModal
                isOpen={cancellationModal.isOpen}
                onClose={() => setCancellationModal(prev => ({ ...prev, isOpen: false, applicationId: null }))}
                onConfirm={handleConfirmCancel}
                influencerName={cancellationModal.influencerName}
            />
            {/* 평판 상세 모달 */}
            <ReputationDetailModal
                isOpen={reputationModal.isOpen}
                onClose={() => setReputationModal(prev => ({ ...prev, isOpen: false }))}
                influencerId={reputationModal.influencerId}
                influencerName={reputationModal.influencerName}
            />

            {/* 운송장 입력 모달 */}
            {trackingModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Truck size={20} />
                            </div>
                            <h2 className="text-xl font-bold">운송장 정보 입력</h2>
                        </div>
                        <form onSubmit={handleTrackingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">택배사</label>
                                <input
                                    type="text"
                                    required
                                    value={trackingModal.company}
                                    onChange={e => setTrackingModal({ ...trackingModal, company: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                    placeholder="예: CJ대한통운, 로젠택배"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">운송장 번호</label>
                                <input
                                    type="text"
                                    required
                                    value={trackingModal.number}
                                    onChange={e => setTrackingModal({ ...trackingModal, number: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                    placeholder="하이픈(-) 없이 숫자만 입력"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-primary h-12 font-bold rounded-xl shadow-lg shadow-rose-100"
                                >
                                    저장 및 알림톡 발송
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-12 font-bold rounded-xl border-gray-200"
                                    onClick={() => setTrackingModal(prev => ({ ...prev, isOpen: false }))}
                                >
                                    취소
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
