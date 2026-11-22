'use client';
import { campaignMutation } from '@/lib/campaignMutationClient';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { sendShippingStartedAlimtalk } from '@/lib/alimtalk';
import { extractOptionCandidates, normalizeOptionLabel } from '@/lib/purchaseLink';
import { getSelectionLinkAssignments, SelectionPurchaseLinkFields, type SelectionLinkDraft } from '@/components/campaign/SelectionPurchaseLinkFields';

import { RATING_TAGS, SatisfactionLevel } from '@/types/review';
import { getApplicationManagementStatus, isSelectedApplication, SELECTION_EMAIL_HOLD_REASONS, type SelectionEmailHold } from '@/lib/selectionEmailHold';
import { APPLICATION_STATUS_LABELS } from '@/constants/status';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ApplicationsTableClientProps {
    initialApplications: Application[];
    initialEmailHolds: SelectionEmailHold[];
    canResolveEmailHolds: boolean;
    campaignId: string;
    campaignTitle: string;
    campaignCategory?: string;
    campaignType?: string;
    campaignProductName?: string;
    productUrlIndividual?: boolean;
    recruitCount: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'held' | 'rejected' | 'cancelled';

import ReputationDetailModal from './ReputationDetailModal';

export default function ApplicationsTableClient({
    initialApplications,
    initialEmailHolds,
    canResolveEmailHolds,
    campaignId,
    campaignTitle,
    campaignCategory,
    campaignType,
    campaignProductName,
    productUrlIndividual = false,
    recruitCount
}: ApplicationsTableClientProps) {
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [filter, setFilter] = useState<FilterType>('all');
    const [emailHolds, setEmailHolds] = useState(initialEmailHolds);
    const [holdTarget, setHoldTarget] = useState<SelectionEmailHold | null>(null);
    const [holdResolutionReason, setHoldResolutionReason] = useState('');
    const [isResolvingHold, setIsResolvingHold] = useState(false);
    const holdsByApplication = useMemo(() => new Map(emailHolds.map(hold => [hold.applicationId, hold])), [emailHolds]);
    useEffect(() => { setEmailHolds(initialEmailHolds); }, [initialEmailHolds]);
    const refreshEmailHolds = useCallback(async () => {
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/email-holds`, { cache: 'no-store' });
            if (!response.ok) throw new Error('보류 내역을 새로고침하지 못했습니다.');
            const result = await response.json();
            setEmailHolds(result.holds);
        } catch {
            toast.error('보류 내역을 새로고침하지 못했습니다. 화면을 다시 열어 확인해 주세요.');
        }
    }, [campaignId]);
    useEffect(() => {
        const onFocus = () => { void refreshEmailHolds(); };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [refreshEmailHolds]);
    const handleResolveHold = async () => {
        if (!holdTarget || !holdResolutionReason.trim() || isResolvingHold) return;
        setIsResolvingHold(true);
        try {
            const response = await fetch(`/api/applications/${holdTarget.applicationId}/email-hold`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: Number(campaignId), holdId: holdTarget.id, reason: holdResolutionReason.trim() }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || '보류 해제에 실패했습니다.');
            setEmailHolds(previous => previous.filter(hold => hold.id !== holdTarget.id));
            setHoldTarget(null);
            toast.success('보류를 해제했습니다. 선정 상태는 유지됩니다.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '보류 해제에 실패했습니다.');
        } finally {
            setIsResolvingHold(false);
            await refreshEmailHolds();
        }
    };
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
    const [selectionLinkDrafts, setSelectionLinkDrafts] = useState<SelectionLinkDraft[]>([]);
    const [selectedOptionLabel, setSelectedOptionLabel] = useState('');
    const [manualLinkId, setManualLinkId] = useState<string>('');
    const [manualPurchaseLinkUrl, setManualPurchaseLinkUrl] = useState('');
    const [linkCandidates, setLinkCandidates] = useState<Array<{
        id: number;
        optionLabel: string;
        purchaseLinkUrl: string;
        usageCount: number;
    }>>([]);
    const [isCandidateLoading, setIsCandidateLoading] = useState(false);
    const [isSelectionSubmitting, setIsSelectionSubmitting] = useState(false);
    const manualPurchaseLinkInput = manualPurchaseLinkUrl.trim();
    const usesOptionLinkFields = productUrlIndividual && selectionMode !== 'REASSIGN';
    const optionAssignments = usesOptionLinkFields ? getSelectionLinkAssignments(selectionLinkDrafts) : null;
    const isSelectionLinkMissing = usesOptionLinkFields ? !optionAssignments : (
        productUrlIndividual &&
        selectionOptions.length <= 1 &&
        !isCandidateLoading &&
        linkCandidates.length === 0 &&
        selectionMode === 'REASSIGN' &&
        !manualPurchaseLinkInput
    );

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
            const managementStatus = getApplicationManagementStatus(app.status, holdsByApplication.get(app.id));
            if (filter === 'held') return managementStatus === 'HELD';
            if (filter === 'approved') {
                return isSelectedApplication(managementStatus);
            }
            return app.status?.toUpperCase() === filter.toUpperCase();
        });
    }, [applications, filter, holdsByApplication]);

    // 통계 계산
    const stats: StatCard[] = useMemo(() => {
        const total = applications.length;
        const pending = applications.filter(app => app.status?.toUpperCase() === 'PENDING').length;
        const approved = applications.filter(app => {
            return isSelectedApplication(getApplicationManagementStatus(app.status, holdsByApplication.get(app.id)));
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
                description: `보류 ${applications.filter(app => getApplicationManagementStatus(app.status, holdsByApplication.get(app.id)) === 'HELD').length}명 · 선정 인원에 포함`,
            },
            {
                title: '거절/취소',
                value: `${rejected + cancelled}명`,
                icon: XCircle,
            },
        ];
    }, [applications, recruitCount, holdsByApplication]);

    const getOptionLabelsFromApplication = (app: Application) => {
        const productFallback = normalizeOptionLabel(campaignProductName || app.campaign?.product_name || '');
        const parsed = extractOptionCandidates(app.selected_option || '');
        if (
            productUrlIndividual &&
            productFallback &&
            parsed.length === 1 &&
            normalizeOptionLabel(parsed[0].label) === '기본 옵션'
        ) {
            return [productFallback];
        }
        if (parsed.length > 0) return parsed.map((item) => item.label);
        const fallback = normalizeOptionLabel(app.selected_option || '');
        return fallback ? [fallback] : [productFallback || '기본 옵션'];
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
        const assignedOptionLabel = normalizeOptionLabel(app.assigned_option_label || '');
        const fallbackOption = normalizeOptionLabel(options[0] || '기본 옵션');
        const defaultOption =
            productUrlIndividual &&
                assignedOptionLabel === '기본 옵션' &&
                fallbackOption !== '기본 옵션'
                ? fallbackOption
                : normalizeOptionLabel(assignedOptionLabel || fallbackOption);
        setSelectionMode(mode);
        setSelectionTarget(app);
        setSelectionOptions(options);
        setSelectionLinkDrafts(options.slice(0, 2).map((optionLabel) => ({ optionLabel, included: true, linkId: '', url: '' })));
        setSelectedOptionLabel(defaultOption);
        setManualLinkId('');
        setManualPurchaseLinkUrl('');
        setIsSelectionModalOpen(true);
        if (productUrlIndividual && mode === 'REASSIGN') {
            await fetchLinkCandidates(defaultOption);
        } else {
            setLinkCandidates([]);
        }
    };

    const closeSelectionModal = () => {
        setIsSelectionModalOpen(false);
        setSelectionTarget(null);
        setSelectionOptions([]);
        setSelectionLinkDrafts([]);
        setSelectedOptionLabel('');
        setManualLinkId('');
        setManualPurchaseLinkUrl('');
        setLinkCandidates([]);
    };

    const handleSelectionSubmit = async () => {
        if (!selectionTarget) return;
        if (isSelectionLinkMissing) {
            toast.error('확정할 옵션의 구매링크를 확인해 주세요.');
            return;
        }
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
                    optionAssignments: optionAssignments || undefined,
                    manualLinkId: manualLinkId ? Number(manualLinkId) : null,
                    manualPurchaseLinkUrl: manualLinkId ? null : manualPurchaseLinkInput || null
                })
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.success) {
                toast.error(payload?.error || '승인/재할당 처리에 실패했습니다.');
                return;
            }

            if (payload.cacheWarning) toast.warning(String(payload.cacheWarning));
            window.dispatchEvent(new Event('campaign-data-changed'));
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
                            assigned_purchase_links: assigned.assigned_purchase_links ?? app.assigned_purchase_links,
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
                const { error } = await campaignMutation('/api/applications/manage', { ids: [id], status: 'REJECTED' })
                    .then(() => ({ error: null }), (error: unknown) => ({ error }));

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

        const { error } = await campaignMutation('/api/applications/manage', {
            ids: [cancellationModal.applicationId], status: 'CANCELLED', reason,
        }).then(() => ({ error: null }), (error: unknown) => ({ error }));

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
        if (productUrlIndividual) {
            toast.error('옵션별 구매링크를 지정하려면 신청자를 개별 승인해 주세요.');
            return;
        }
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

                if (payload.cacheWarning) toast.warning(String(payload.cacheWarning));
                window.dispatchEvent(new Event('campaign-data-changed'));
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

        const { error } = await campaignMutation('/api/applications/manage', { ids, status: 'REJECTED' })
            .then(() => ({ error: null }), (error: unknown) => ({ error }));

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
        try {
            const response = await fetch('/api/applications/resend-selection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id })
            });
            const result = await response.json().catch(() => null);
            if (!response.ok || !result?.success) {
                toast.warning(result?.error || result?.errors?.[0] || '선정 알림 재발송에 실패했습니다.');
                return;
            }
            toast.success('선정 알림을 재발송했습니다.');
        } catch (error) {
            console.error('Selection notification resend error:', error);
            toast.error('선정 알림 재발송에 실패했습니다.');
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
            '상태': getApplicationManagementStatus(app.status, holdsByApplication.get(app.id)) === 'HELD' ? '보류됨' : APPLICATION_STATUS_LABELS[app.status] || app.status,
            '선정 상태': APPLICATION_STATUS_LABELS[app.status] || app.status,
            '보류 사유': isSelectedApplication(app.status) && holdsByApplication.has(app.id) ? SELECTION_EMAIL_HOLD_REASONS[holdsByApplication.get(app.id)!.reason] : '',
            '반송 수신 주소': isSelectedApplication(app.status) ? holdsByApplication.get(app.id)?.recipient || '' : '',
            '반송일시': isSelectedApplication(app.status) && holdsByApplication.has(app.id) ? new Date(holdsByApplication.get(app.id)!.occurredAt).toLocaleString('ko-KR') : '',
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
        emailHolds: holdsByApplication,
        onResolveEmailHold: canResolveEmailHolds ? (hold) => { setHoldTarget(hold); setHoldResolutionReason(''); } : undefined,
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
    }), [influencerStats, reviewedInfluencerIds, applications, campaignType, productUrlIndividual, holdsByApplication, canResolveEmailHolds]);

    // 필터별 개수
    const filterCounts = useMemo(() => ({
        all: applications.length,
        pending: applications.filter(app => app.status?.toUpperCase() === 'PENDING').length,
        approved: applications.filter(app => {
            return isSelectedApplication(getApplicationManagementStatus(app.status, holdsByApplication.get(app.id)));
        }).length,
        held: applications.filter(app => getApplicationManagementStatus(app.status, holdsByApplication.get(app.id)) === 'HELD').length,
        rejected: applications.filter(app => app.status?.toUpperCase() === 'REJECTED').length,
        cancelled: applications.filter(app => app.status?.toUpperCase() === 'CANCELLED').length,
    }), [applications, holdsByApplication]);

    return (
        <div className="space-y-6">
            {/* 통계 카드 */}
            <StatsCards stats={stats} />

            {/* 필터 탭 & 액션 버튼 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs value={filter} onValueChange={(value) => { setFilter(value as FilterType); setSelectedApplications([]); }} className="min-w-0 max-w-full overflow-x-auto">
                    <TabsList className="w-max">
                        <TabsTrigger value="all">전체 {filterCounts.all}</TabsTrigger>
                        <TabsTrigger value="pending">대기중 {filterCounts.pending}</TabsTrigger>
                        <TabsTrigger value="approved">승인됨 {filterCounts.approved}</TabsTrigger>
                        <TabsTrigger value="held">보류됨 {filterCounts.held}</TabsTrigger>
                        <TabsTrigger value="rejected">거절됨 {filterCounts.rejected}</TabsTrigger>
                        <TabsTrigger value="cancelled">취소됨 {filterCounts.cancelled}</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-2">
                <Button onClick={() => void refreshEmailHolds()} variant="outline" size="sm">보류 새로고침</Button>
                <Button onClick={handleExportExcel} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Excel 다운로드
                </Button>
                </div>
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

            <Dialog open={Boolean(holdTarget)} onOpenChange={(open) => { if (!open && !isResolvingHold) setHoldTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>메일 반송 보류 해제</DialogTitle>
                        <DialogDescription>주소 수정·재발송 결과 또는 별도 연락을 확인한 뒤 해제 사유를 남겨 주세요. 참여 권한은 유지되며, 이메일 수신 차단은 별도로 확인해야 합니다.</DialogDescription>
                    </DialogHeader>
                    <label htmlFor="hold-resolution-reason" className="text-sm font-medium">해제 사유</label>
                    <textarea id="hold-resolution-reason" value={holdResolutionReason} onChange={(event) => setHoldResolutionReason(event.target.value)} maxLength={500} rows={3} className="w-full rounded-md border p-3 text-sm" disabled={isResolvingHold} />
                    <Button onClick={() => void handleResolveHold()} disabled={isResolvingHold || !holdResolutionReason.trim()}>{isResolvingHold ? '처리 중…' : '보류 해제'}</Button>
                </DialogContent>
            </Dialog>

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
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90dvh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-2">
                            {selectionMode === 'REASSIGN' ? '구매링크 재할당' : '승인 옵션 및 링크 배정'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {selectionTarget.user?.nickname || '인플루언서'}님의 신청 옵션을 확인하세요.
                        </p>

                        <div className="space-y-4">
                            {!usesOptionLinkFields && <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">확정 옵션</label>
                                {selectionOptions.length > 1 ? (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                        <p className="mb-2 text-xs font-semibold text-blue-700">신청한 옵션을 확인하세요.</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectionOptions.map((option) => (
                                                <span key={option} className="rounded-md bg-white px-2 py-1 text-sm font-semibold text-blue-800">{option}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : <select
                                    value={selectedOptionLabel}
                                    onChange={async (e) => {
                                        const value = e.target.value;
                                        setSelectedOptionLabel(value);
                                        setManualLinkId('');
                                        setManualPurchaseLinkUrl('');
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
                                </select>}
                            </div>}

                            {usesOptionLinkFields ? (
                                <div className="space-y-3">
                                    {selectionLinkDrafts.map((draft, index) => (
                                        <SelectionPurchaseLinkFields
                                            key={draft.optionLabel}
                                            campaignId={Number(campaignId)}
                                            draft={draft}
                                            optional={selectionLinkDrafts.length > 1}
                                            disabled={isSelectionSubmitting}
                                            onChange={(updated) => setSelectionLinkDrafts((previous) =>
                                                previous.map((item, position) => position === index ? updated : item)
                                            )}
                                        />
                                    ))}
                                    {!selectionLinkDrafts.some((draft) => draft.included) && (
                                        <p className="text-sm text-rose-700">확정할 옵션을 하나 이상 선택해 주세요.</p>
                                    )}
                                </div>
                            ) : productUrlIndividual ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">링크 배정 방식</label>
                                    <select
                                        value={manualLinkId}
                                        onChange={(e) => {
                                            setManualLinkId(e.target.value);
                                            if (e.target.value) setManualPurchaseLinkUrl('');
                                        }}
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
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">구매링크 직접 입력</label>
                                        <input
                                            type="url"
                                            value={manualPurchaseLinkUrl}
                                            onChange={(e) => {
                                                setManualPurchaseLinkUrl(e.target.value);
                                                if (e.target.value.trim()) setManualLinkId('');
                                            }}
                                            placeholder="https://..."
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                    {isSelectionLinkMissing && (
                                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                            구매링크가 없습니다. 직접 입력해야 승인 알림과 상세페이지에 구매링크를 전달할 수 있습니다.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                    공통 구매링크가 등록되어 있으면 선정 메일에 포함됩니다.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-6">
                            <Button
                                type="button"
                                onClick={handleSelectionSubmit}
                                disabled={isSelectionSubmitting || isSelectionLinkMissing}
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
