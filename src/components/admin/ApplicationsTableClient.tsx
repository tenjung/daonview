'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Users, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import { Application, InfluencerReview } from '@/types/database';
import { DataTable } from '@/components/ui/data-table';
import { StatsCards, StatCard } from '@/components/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { createApplicationColumns } from './applications-columns';
import ConfirmDialog from '@/components/ConfirmDialog';
import InfluencerReviewModal from './InfluencerReviewModal';
import BulkActionsBar from './BulkActionsBar';
import * as XLSX from 'xlsx';

interface ApplicationsTableClientProps {
    initialApplications: Application[];
    campaignId: string;
    campaignTitle: string;
    campaignCategory?: string;
    recruitCount: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function ApplicationsTableClient({
    initialApplications,
    campaignId,
    campaignTitle,
    campaignCategory,
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
    const [influencerReviews, setInfluencerReviews] = useState<Map<string, string[]>>(new Map());
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

    // initialApplications가 변경될 때마다 applications 상태 업데이트
    useEffect(() => {
        setApplications(initialApplications);
        loadInfluencerReviews();
    }, [initialApplications]);

    // 인플루언서 평가 데이터 로드
    const loadInfluencerReviews = async () => {
        const influencerIds = initialApplications.map(app => app.user_id).filter(Boolean);
        if (influencerIds.length === 0) return;

        const { data, error } = await supabase
            .from('influencer_reviews')
            .select('influencer_id, rating_tags')
            .in('influencer_id', influencerIds);

        if (!error && data) {
            const reviewsMap = new Map<string, string[]>();
            data.forEach(review => {
                const existing = reviewsMap.get(review.influencer_id) || [];
                reviewsMap.set(review.influencer_id, [...existing, ...review.rating_tags]);
            });
            setInfluencerReviews(reviewsMap);
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

        return [
            {
                title: '총 신청자',
                value: `${total}명`,
                icon: Users,
                description: `모집 인원: ${recruitCount}명`
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
                title: '거절됨',
                value: `${rejected}명`,
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
                const { error } = await supabase
                    .from('applications')
                    .update({ status: 'APPROVED' })
                    .eq('id', id);

                if (error) {
                    toast.error('승인 처리 중 오류가 발생했습니다.');
                    return;
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

    // 평가 모달 열기
    const handleOpenReview = (userId: string, name: string) => {
        setReviewModal({
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

    // Excel 내보내기
    const handleExportExcel = () => {
        const exportData = filteredApplications.map(app => ({
            '신청일시': new Date(app.created_at).toLocaleString('ko-KR'),
            '이름': app.user?.nickname || '',
            '이메일': app.user?.email || '',
            '전화번호': app.user?.phone_number || '',
            'SNS': app.user?.sns_url || '',
            '신청메시지': app.message || '',
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
        onOpenReview: handleOpenReview,
    }), []);

    // 필터별 개수
    const filterCounts = useMemo(() => ({
        all: applications.length,
        pending: applications.filter(app => app.status?.toUpperCase() === 'PENDING').length,
        approved: applications.filter(app => app.status?.toUpperCase() === 'APPROVED').length,
        rejected: applications.filter(app => app.status?.toUpperCase() === 'REJECTED').length,
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
        </div>
    );
}
