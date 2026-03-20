'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
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
import { extractOptionCandidates, normalizeOptionLabel } from '@/lib/purchaseLink';

import { RATING_TAGS, SatisfactionLevel } from '@/types/review';

interface ApplicationsTableClientProps {
    initialApplications: Application[];
    campaignId: string;
    campaignTitle: string;
    campaignProvidedItems?: string;
    campaignDeadlineDate?: string;
    campaignCategory?: string;
    campaignType?: string;
    productUrlIndividual?: boolean;
    recruitCount: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

import ReputationDetailModal from './ReputationDetailModal';

export default function ApplicationsTableClient({
    initialApplications,
    campaignId,
    campaignTitle,
    campaignProvidedItems,
    campaignDeadlineDate,
    campaignCategory,
    campaignType,
    productUrlIndividual = false,
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
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'APPROVE' | 'REASSIGN'>('APPROVE');
    const [selectionTarget, setSelectionTarget] = useState<Application | null>(null);
    const [selectionOptions, setSelectionOptions] = useState<string[]>([]);
    const [selectedOptionLabel, setSelectedOptionLabel] = useState('');
    const [manualLinkId, setManualLinkId] = useState<string>('');
    const [linkCandidates, setLinkCandidates] = useState<Array<{
        id: number;
        optionLabel: string;
        purchaseLinkUrl: string;
        usageCount: number;
    }>>([]);
    const [isCandidateLoading, setIsCandidateLoading] = useState(false);
    const [isSelectionSubmitting, setIsSelectionSubmitting] = useState(false);

    const [influencerStats, setInfluencerStats] = useState<Map<string, {
        tags: string[];
        cancellations: number;
        satisfaction: SatisfactionLevel[];
        daonIndex?: number;
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

            // 3. 다온지수 가져오기
            const { data: daonData } = await supabase
                .from('influencer_stats')
                .select('user_id, daon_index')
                .in('user_id', influencerIds);

            const statsMap = new Map<string, {
                tags: string[];
                cancellations: number;
                satisfaction: SatisfactionLevel[];
                daonIndex?: number;
            }>();

            // 요약 데이터 구성
            influencerIds.forEach(id => {
                const reviews = reviewsData?.filter(r => r.influencer_id === id) || [];
                const cancels = cancelData?.filter(c => c.user_id === id).length || 0;
                const daonInfo = daonData?.find(d => d.user_id === id);

                statsMap.set(id, {
                    tags: reviews.flatMap(r => r.rating_tags),
                    cancellations: cancels,
                    satisfaction: reviews.map(r => r.satisfaction).filter(Boolean) as SatisfactionLevel[],
                    daonIndex: daonInfo?.daon_index !== null ? daonInfo?.daon_index : undefined
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
            if (filter === 'approved') {
                const status = app.status?.toUpperCase();
                return status === 'APPROVED' || status === 'SELECTED';
            }
            return app.status?.toUpperCase() === filter.toUpperCase();
        });
    }, [applications, filter]);

    // 통계 계산
    const stats: StatCard[] = useMemo(() => {
        const total = applications.length;
        const pending = applications.filter(app => app.status?.toUpperCase() === 'PENDING').length;
        const approved = applications.filter(app => {
            const status = app.status?.toUpperCase();
            return status === 'APPROVED' || status === 'SELECTED';
        }).length;
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

    const getOptionLabelsFromApplication = (app: Application) => {
        const parsed = extractOptionCandidates(app.selected_option || '');
        if (parsed.length > 0) return parsed.map((item) => item.label);
        const fallback = normalizeOptionLabel(app.selected_option || '');
        return fallback ? [fallback] : ['기본 옵션'];
    };

    const fetchLinkCandidates = async (optionLabel: string) => {
        setIsCandidateLoading(true);
        try {
            const response = await fetch('/api/applications/link-candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: Number(campaignId),
                    optionLabel
                })
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.success) {
                setLinkCandidates([]);
                return;
            }

            setLinkCandidates(payload.candidates || []);
        } catch (error) {
            console.error('Fetch link candidates error:', error);
            setLinkCandidates([]);
        } finally {
            setIsCandidateLoading(false);
        }
    };

    const openSelectionModal = async (app: Application, mode: 'APPROVE' | 'REASSIGN') => {
        const options = getOptionLabelsFromApplication(app);
        const defaultOption = normalizeOptionLabel(app.assigned_option_label || options[0] || '기본 옵션');
        setSelectionMode(mode);
        setSelectionTarget(app);
        setSelectionOptions(options);
        setSelectedOptionLabel(defaultOption);
        setManualLinkId('');
        setIsSelectionModalOpen(true);
        if (productUrlIndividual) {
            await fetchLinkCandidates(defaultOption);
        } else {
            setLinkCandidates([]);
        }
    };

    const closeSelectionModal = () => {
        setIsSelectionModalOpen(false);
        setSelectionTarget(null);
        setSelectionOptions([]);
        setSelectedOptionLabel('');
        setManualLinkId('');
        setLinkCandidates([]);
    };

    const handleSelectionSubmit = async () => {
        if (!selectionTarget) return;
        setIsSelectionSubmitting(true);
        try {
            const endpoint =
                selectionMode === 'REASSIGN'
                    ? '/api/applications/reassign-link'
                    : '/api/applications/select';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: selectionTarget.id,
                    campaignId: Number(campaignId),
                    targetStatus: 'APPROVED',
                    assignedOptionLabel: selectedOptionLabel,
                    manualLinkId: manualLinkId ? Number(manualLinkId) : null
                })
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.success) {
                toast.error(payload?.error || '승인/재할당 처리에 실패했습니다.');
                return;
            }

            const assigned = payload.application || {};
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === selectionTarget.id
                        ? {
                            ...app,
                            status: assigned.status || app.status,
                            assigned_option_key: assigned.assigned_option_key ?? app.assigned_option_key,
                            assigned_option_label: assigned.assigned_option_label ?? app.assigned_option_label,
                            assigned_purchase_link_id: assigned.assigned_purchase_link_id ?? app.assigned_purchase_link_id,
                            assigned_purchase_link_url: assigned.assigned_purchase_link_url ?? app.assigned_purchase_link_url,
                            link_assigned_at: assigned.link_assigned_at ?? app.link_assigned_at,
                            link_updated_at: assigned.link_updated_at ?? app.link_updated_at
                        }
                        : app
                )
            );

            if (payload.notification && payload.notification.success === false) {
                toast.warning(
                    selectionMode === 'REASSIGN'
                        ? '링크 변경은 완료되었지만 일부 알림 발송에 실패했습니다.'
                        : '승인은 완료되었지만 일부 알림 발송에 실패했습니다.'
                );
            } else {
                toast.success(selectionMode === 'REASSIGN' ? '링크를 재할당했습니다.' : '신청이 승인되었습니다.');
            }

            closeSelectionModal();
        } catch (error) {
            console.error('Selection modal submit error:', error);
            toast.error('승인/재할당 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSelectionSubmitting(false);
        }
    };

    // 승인 처리
    const handleApprove = async (app: Application) => {
        await openSelectionModal(app, 'APPROVE');
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
        const pendingTargets = selectedApplications.filter(
            (app) => String(app.status || '').toUpperCase() === 'PENDING'
        );
        if (pendingTargets.length === 0) {
            toast.error('대기중(PENDING) 신청만 일괄 승인할 수 있습니다.');
            return;
        }

        let successCount = 0;
        const failedIds: number[] = [];

        for (const app of pendingTargets) {
            const optionLabels = getOptionLabelsFromApplication(app);
            const assignedOptionLabel = normalizeOptionLabel(app.assigned_option_label || optionLabels[0] || '기본 옵션');

            try {
                const response = await fetch('/api/applications/select', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        applicationId: app.id,
                        campaignId: Number(campaignId),
                        targetStatus: 'APPROVED',
                        assignedOptionLabel,
                    })
                });
                const payload = await response.json().catch(() => null);
                if (!response.ok || !payload?.success) {
                    failedIds.push(app.id);
                    continue;
                }

                const assigned = payload.application || {};
                setApplications((prev) =>
                    prev.map((item) =>
                        item.id === app.id
                            ? {
                                ...item,
                                status: assigned.status || item.status,
                                assigned_option_key: assigned.assigned_option_key ?? item.assigned_option_key,
                                assigned_option_label: assigned.assigned_option_label ?? item.assigned_option_label,
                                assigned_purchase_link_id: assigned.assigned_purchase_link_id ?? item.assigned_purchase_link_id,
                                assigned_purchase_link_url: assigned.assigned_purchase_link_url ?? item.assigned_purchase_link_url,
                                link_assigned_at: assigned.link_assigned_at ?? item.link_assigned_at,
                                link_updated_at: assigned.link_updated_at ?? item.link_updated_at
                            }
                            : item
                    )
                );
                successCount += 1;
            } catch (error) {
                console.error(`Bulk approve error for app ${app.id}:`, error);
                failedIds.push(app.id);
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount}개의 신청이 승인되었습니다.`);
        }
        if (failedIds.length > 0) {
            toast.warning(`일부 승인 실패 (${failedIds.length}건)`);
        }
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

    const handleResendNotification = async (app: Application) => {
        const userName = app.user?.nickname || app.user?.name || '인플루언서';
        const errors: string[] = [];

        try {
            if (app.user?.phone_number) {
                const alimtalkResult = await sendInfluencerSelectedAlimtalk(
                    app.user.phone_number,
                    userName,
                    campaignTitle,
                    parseInt(campaignId),
                    {
                        assignedOptionLabel: app.assigned_option_label,
                        assignedPurchaseLink: app.assigned_purchase_link_url
                    }
                );
                if (!alimtalkResult.success) {
                    errors.push(alimtalkResult.error || '알림톡 발송 실패');
                }
            } else {
                errors.push('연락처 미등록');
            }

            if (app.user?.email) {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: app.user.email,
                        type: 'CAMPAIGN_SELECTED',
                        params: {
                            nickname: userName,
                            campaignTitle,
                            providedItems: campaignProvidedItems,
                            deadlineDate: campaignDeadlineDate,
                            assignedOptionLabel: app.assigned_option_label,
                            assignedPurchaseLink: app.assigned_purchase_link_url,
                            email: app.user.email
                        }
                    })
                });
                const payload = await response.json().catch(() => null);
                if (!response.ok || !payload?.success) {
                    errors.push(payload?.error || payload?.message || '이메일 발송 실패');
                }
            } else {
                errors.push('이메일 미등록');
            }

            if (errors.length > 0) {
                console.warn('Resend notification warnings:', { applicationId: app.id, errors });
                toast.warning('일부 알림 재발송에 실패했습니다.');
                return;
            }

            toast.success('카카오/이메일 재발송 완료');
        } catch (error) {
            console.error('Resend notification error:', error);
            toast.error('알림 재발송 중 오류가 발생했습니다.');
        }
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
            const updateData: {
                extension_status: 'APPROVED' | 'REJECTED';
                review_deadline?: string;
            } = { extension_status: action };

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

    const exportApplicationsToExcel = (targetApplications: Application[], fileLabel: string) => {
        const exportData = targetApplications.map(app => ({
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
        XLSX.writeFile(wb, `${campaignTitle}_${fileLabel}_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel 파일이 다운로드되었습니다.');
    };

    // Excel 내보내기
    const handleExportExcel = () => {
        exportApplicationsToExcel(filteredApplications, '신청자');
    };

    const handleExportSelectedExcel = () => {
        if (selectedApplications.length === 0) {
            toast.error('선택된 신청자가 없습니다.');
            return;
        }
        exportApplicationsToExcel(selectedApplications, '선택신청자');
    };

    // 컬럼 정의
    const columns = useMemo(() => createApplicationColumns({
        onApprove: handleApprove,
        onReject: handleReject,
        onCancel: handleCancel,
        onOpenReview: handleOpenReview,
        onOpenReputation: handleOpenReputation,
        onResendNotification: handleResendNotification,
        onReassignLink: (app) => openSelectionModal(app, 'REASSIGN'),
        onUpdateTracking: handleUpdateTracking,
        onHandleExtension: handleExtension,
        influencerStats: influencerStats,
        reviewedInfluencerIds: reviewedInfluencerIds,
        campaignType: campaignType,
        productUrlIndividual,
    }), [influencerStats, reviewedInfluencerIds, applications, campaignType, productUrlIndividual]);

    // 필터별 개수
    const filterCounts = useMemo(() => ({
        all: applications.length,
        pending: applications.filter(app => app.status?.toUpperCase() === 'PENDING').length,
        approved: applications.filter(app => {
            const status = app.status?.toUpperCase();
            return status === 'APPROVED' || status === 'SELECTED';
        }).length,
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
                    onExport={handleExportSelectedExcel}
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

            {isSelectionModalOpen && selectionTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-2">
                            {selectionMode === 'REASSIGN' ? '구매링크 재할당' : '승인 옵션 및 링크 배정'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {selectionTarget.user?.nickname || '인플루언서'}님의 확정 옵션을 선택하세요.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">확정 옵션</label>
                                <select
                                    value={selectedOptionLabel}
                                    onChange={async (e) => {
                                        const value = e.target.value;
                                        setSelectedOptionLabel(value);
                                        setManualLinkId('');
                                        if (productUrlIndividual) {
                                            await fetchLinkCandidates(value);
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    {selectionOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {productUrlIndividual ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">링크 배정 방식</label>
                                    <select
                                        value={manualLinkId}
                                        onChange={(e) => setManualLinkId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        disabled={isCandidateLoading}
                                    >
                                        <option value="">자동 배정 (최소사용우선)</option>
                                        {linkCandidates.map((candidate) => (
                                            <option key={candidate.id} value={candidate.id}>
                                                #{candidate.id} (사용 {candidate.usageCount}건)
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isCandidateLoading
                                            ? '링크 후보를 불러오는 중...'
                                            : '수동 링크를 지정하지 않으면 최소사용우선으로 자동 배정됩니다.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                    이 캠페인은 개별 구매링크를 사용하지 않습니다.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-6">
                            <Button
                                type="button"
                                onClick={handleSelectionSubmit}
                                disabled={isSelectionSubmitting}
                                className="flex-1 bg-primary h-11 font-bold rounded-xl"
                            >
                                {isSelectionSubmitting
                                    ? '처리 중...'
                                    : selectionMode === 'REASSIGN'
                                        ? '재할당 실행'
                                        : '승인 확정'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-11 font-bold rounded-xl border-gray-200"
                                onClick={closeSelectionModal}
                            >
                                취소
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
