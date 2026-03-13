'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import { toast } from 'sonner';
import { ADVERTISER_LINKS } from '@/constants/navigation';
import { sendInfluencerSelectedAlimtalk, sendShippingStartedAlimtalk } from '@/lib/alimtalk';
import { ExternalLink } from 'lucide-react';
import { extractOptionCandidates, normalizeOptionLabel } from '@/lib/purchaseLink';

interface Applicant {
    id: number;
    created_at: string;
    status: string;
    application_message: string;
    selected_option?: string;
    assigned_option_key?: string;
    assigned_option_label?: string;
    assigned_purchase_link_id?: number;
    assigned_purchase_link_url?: string;
    link_assigned_at?: string;
    link_updated_at?: string;
    campaign: {
        id: number;
        title: string;
        type: string;
        is_always: boolean;
        end_date?: string;
        experience_details?: string;
        product_name?: string;
        campaign_options?: any;
    };
    user: {
        id: string;
        nickname: string;
        blog_url?: string;
        instagram_url?: string;
        avatar_url?: string;
    };
    tracking_company?: string;
    tracking_number?: string;
    extension_status?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    extension_reason?: string;
    review_deadline?: string;
}

interface TrackingForm {
    applicationId: number;
    company: string;
    number: string;
}

interface LinkCandidate {
    id: number;
    optionLabel: string;
    purchaseLinkUrl: string;
    usageCount: number;
}

function getApplicantStatusMeta(applicant: Applicant) {
    const isSelected = applicant.status === 'SELECTED' || applicant.status === 'APPROVED';

    if (applicant.status === 'REJECTED') {
        return {
            label: '거절됨',
            className: 'bg-gray-100 text-gray-500',
        };
    }

    if (isSelected) {
        return {
            label: '선정됨',
            className: 'bg-emerald-100 text-emerald-700',
        };
    }

    return {
        label: '대기중',
        className: 'bg-blue-100 text-blue-700',
    };
}

export default function AdvertiserApplicantsPage() {
    const { user, profile, isLoading } = useAuthStore();
    const router = useRouter();
    const [campaignIdFilter, setCampaignIdFilter] = useState<number | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTracking, setEditingTracking] = useState<TrackingForm | null>(null);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'SELECT' | 'REASSIGN'>('SELECT');
    const [selectionTarget, setSelectionTarget] = useState<Applicant | null>(null);
    const [selectionOptions, setSelectionOptions] = useState<string[]>([]);
    const [selectedOptionLabel, setSelectedOptionLabel] = useState('');
    const [manualLinkId, setManualLinkId] = useState<string>('');
    const [linkCandidates, setLinkCandidates] = useState<LinkCandidate[]>([]);
    const [isCandidateLoading, setIsCandidateLoading] = useState(false);
    const [isSelectionSubmitting, setIsSelectionSubmitting] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const value = params.get('campaignId');
        setCampaignIdFilter(value ? Number(value) : null);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (campaignIdFilter !== null) return;
        if (isLoading) return;

        router.replace('/dashboard/advertiser/campaigns');
    }, [campaignIdFilter, isLoading, router]);

    useEffect(() => {
        if (campaignIdFilter === null) return;
        if (!isLoading && user) {
            fetchApplicants();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [isLoading, user, campaignIdFilter]);

    const fetchApplicants = async () => {
        if (!user) return;
        setLoading(true);
        try {

            // 1. 내가 만든 캠페인 ID들을 먼저 가져옴
            const { data: myCampaigns } = await supabase
                .from('campaigns')
                .select('id')
                .eq('created_by', user.id);

            if (!myCampaigns || myCampaigns.length === 0) {
                setLoading(false);
                return;
            }

            const campaignIds = myCampaigns.map(c => c.id);
            const filteredCampaignIds =
                campaignIdFilter && campaignIds.includes(campaignIdFilter)
                    ? [campaignIdFilter]
                    : campaignIds;

            // 2. 해당 캠페인들에 지원한 지원자 조회
            const { data, error } = await supabase
                .from('applications')
                .select(`
                    id,
                    created_at,
                    status,
                    application_message,
                    selected_option,
                    assigned_option_key,
                    assigned_option_label,
                    assigned_purchase_link_id,
                    assigned_purchase_link_url,
                    link_assigned_at,
                    link_updated_at,
                    campaign:campaign_id (id, title, type, is_always, end_date, experience_details, product_name, campaign_options),
                    user:user_id (id, nickname, blog_url, instagram_url, avatar_url),
                    tracking_company,
                    tracking_number,
                    extension_status,
                    extension_reason,
                    review_deadline
                `)
                .in('campaign_id', filteredCampaignIds)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 타입 안전성을 위해 데이터 매핑 (Supabase join은 배열로 반환될 수 있음)
            const formattedData = (data || []).map((item: any) => ({
                ...item,
                campaign: Array.isArray(item.campaign) ? item.campaign[0] : item.campaign,
                user: Array.isArray(item.user) ? item.user[0] : item.user
            }));

            setApplicants(formattedData);
        } catch (error) {
            console.error('Error fetching applicants:', error);
            toast.error('신청자 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleExtensionAction = async (applicationId: number, action: 'APPROVED' | 'REJECTED') => {
        try {
            const applicant = applicants.find(a => a.id === applicationId);
            let updateData: any = { extension_status: action };

            if (action === 'APPROVED' && applicant?.review_deadline) {
                const currentDeadline = new Date(applicant.review_deadline);
                currentDeadline.setDate(currentDeadline.getDate() + 7); // 7일 연장
                updateData.review_deadline = currentDeadline.toISOString();
            }

            const { error } = await supabase
                .from('applications')
                .update(updateData)
                .eq('id', applicationId);

            if (error) throw error;

            toast.success(action === 'APPROVED' ? '연장 요청이 승인되었습니다.' : '연장 요청이 거절되었습니다.');
            
            setApplicants(prev => prev.map(app => 
                app.id === applicationId 
                    ? { ...app, extension_status: action, review_deadline: updateData.review_deadline || app.review_deadline } 
                    : app
            ));
        } catch (error) {
            console.error('Extension action error:', error);
            toast.error('처리 중 오류가 발생했습니다.');
        }
    };

    const handleTrackingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTracking) return;

        try {
            const now = new Date();
            const deadline = new Date(now);
            deadline.setDate(deadline.getDate() + 7); // 배송 시작 후 1주

            const { error } = await supabase
                .from('applications')
                .update({
                    tracking_company: editingTracking.company,
                    tracking_number: editingTracking.number,
                    shipped_at: now.toISOString(),
                    review_deadline: deadline.toISOString()
                })
                .eq('id', editingTracking.applicationId);

            if (error) throw error;

            toast.success('운송장 정보가 등록되었습니다.');

            // 알림톡 발송
            const applicant = applicants.find(a => a.id === editingTracking.applicationId);
            if (applicant && applicant.user.id) {
                const { data: userData } = await supabase
                    .from('profiles')
                    .select('phone_number, nickname, name')
                    .eq('id', applicant.user.id)
                    .single();

                if (userData?.phone_number) {
                    await sendShippingStartedAlimtalk(
                        userData.phone_number,
                        userData.nickname || userData.name || '인플루언서',
                        applicant.campaign.title,
                        editingTracking.company,
                        editingTracking.number
                    );
                }
            }

            // 목록 갱신
            setApplicants(prev => prev.map(app =>
                app.id === editingTracking.applicationId 
                    ? { ...app, tracking_company: editingTracking.company, tracking_number: editingTracking.number } 
                    : app
            ));
            setEditingTracking(null);

        } catch (error) {
            console.error('Tracking update error:', error);
            toast.error('운송장 등록 중 오류가 발생했습니다.');
        }
    };

    const sendSelectionNotifications = async (applicant: Applicant, campaignId: number) => {
        const notifyErrors: string[] = [];

        const { data: userData } = await supabase
            .from('profiles')
            .select('phone_number, name, nickname, email')
            .eq('id', applicant.user.id)
            .single();

        const recipientName = userData?.nickname || userData?.name || '인플루언서';
        const providedItems =
            applicant.campaign.experience_details ||
            applicant.campaign.product_name ||
            '캠페인 상세 페이지 참조';
        const deadlineDate = applicant.campaign.end_date
            ? new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date(applicant.campaign.end_date))
            : '캠페인 상세 페이지 참조';

        if (userData?.phone_number) {
            const alimtalkResult = await sendInfluencerSelectedAlimtalk(
                userData.phone_number,
                recipientName,
                applicant.campaign.title,
                campaignId,
                {
                    assignedOptionLabel: applicant.assigned_option_label,
                    assignedPurchaseLink: applicant.assigned_purchase_link_url
                }
            );

            if (!alimtalkResult.success) {
                notifyErrors.push(`카카오 알림톡 실패: ${alimtalkResult.error || 'unknown error'}`);
            }
        } else {
            notifyErrors.push('카카오 알림톡 스킵: 전화번호 없음');
        }

        if (userData?.email) {
            const emailResponse = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userData.email,
                    type: 'CAMPAIGN_SELECTED',
                    params: {
                        nickname: recipientName,
                        campaignTitle: applicant.campaign.title,
                        providedItems,
                        deadlineDate,
                        assignedOptionLabel: applicant.assigned_option_label,
                        assignedPurchaseLink: applicant.assigned_purchase_link_url,
                        email: userData.email
                    }
                })
            });

            const emailResult = await emailResponse.json().catch(() => null);
            if (!emailResponse.ok || !emailResult?.success) {
                notifyErrors.push(`이메일 실패: ${emailResult?.error || emailResult?.message || emailResponse.statusText}`);
            }
        } else {
            notifyErrors.push('이메일 스킵: 이메일 주소 없음');
        }

        if (notifyErrors.length > 0) {
            console.error('Selection notification errors:', {
                applicationId: applicant.id,
                userId: applicant.user.id,
                errors: notifyErrors
            });
            return { success: false };
        }

        return { success: true };
    };

    const getOptionLabelsFromApplication = (applicant: Applicant) => {
        const parsed = extractOptionCandidates(applicant.selected_option || '');
        if (parsed.length > 0) return parsed.map((item) => item.label);
        const fallback = normalizeOptionLabel(applicant.selected_option || '');
        return fallback ? [fallback] : ['기본 옵션'];
    };

    const isIndividualLinkCampaign = (applicant: Applicant) => {
        const optionsRaw = applicant.campaign.campaign_options;
        const options = Array.isArray(optionsRaw) ? optionsRaw[0] : optionsRaw;
        const step1 = options?.step1Data || {};
        return Boolean(step1.productUrlIndividual);
    };

    const fetchLinkCandidates = async (campaignId: number, optionLabel: string) => {
        setIsCandidateLoading(true);
        try {
            const response = await fetch('/api/applications/link-candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId, optionLabel })
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

    const openSelectionModal = async (applicant: Applicant, mode: 'SELECT' | 'REASSIGN') => {
        const options = getOptionLabelsFromApplication(applicant);
        const defaultOption = normalizeOptionLabel(applicant.assigned_option_label || options[0] || '기본 옵션');

        setSelectionMode(mode);
        setSelectionTarget(applicant);
        setSelectionOptions(options);
        setSelectedOptionLabel(defaultOption);
        setManualLinkId('');
        setIsSelectionModalOpen(true);
        if (isIndividualLinkCampaign(applicant)) {
            await fetchLinkCandidates(applicant.campaign.id, defaultOption);
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
                    campaignId: selectionTarget.campaign.id,
                    targetStatus: 'SELECTED',
                    assignedOptionLabel: selectedOptionLabel,
                    manualLinkId: manualLinkId ? Number(manualLinkId) : null
                })
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.success) {
                toast.error(payload?.error || '선정/재할당 처리에 실패했습니다.');
                return;
            }

            const assigned = payload.application || {};

            setApplicants((prev) =>
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
                        : '선정은 완료되었지만 일부 알림 발송에 실패했습니다.'
                );
            } else {
                toast.success(selectionMode === 'REASSIGN' ? '링크를 재할당했습니다.' : '리뷰어를 선정했습니다.');
            }

            closeSelectionModal();
        } catch (error) {
            console.error('Selection submit error:', error);
            toast.error('선정/재할당 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSelectionSubmitting(false);
        }
    };

    const handleStatusChange = async (applicationId: number, newStatus: string) => {
        try {
            const applicant = applicants.find(a => a.id === applicationId);
            if (newStatus === 'SELECTED') {
                if (!applicant) return;
                await openSelectionModal(applicant, 'SELECT');
                return;
            }

            const updateData = { status: newStatus };

            const { error: appError } = await supabase
                .from('applications')
                .update(updateData)
                .eq('id', applicationId);

            if (appError) throw appError;
            toast.success('신청을 거절했습니다.');

            // 목록 갱신
            setApplicants(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status: newStatus } : app
            ));

        } catch (error) {
            console.error('Status update error:', error);
            toast.error('상태 변경 중 오류가 발생했습니다.');
        }
    };

    const handleResendSelectionNotification = async (applicant: Applicant) => {
        try {
            const notifyResult = await sendSelectionNotifications(applicant, applicant.campaign.id);
            if (!notifyResult.success) {
                toast.warning('일부 알림 발송에 실패했습니다. 콘솔 로그를 확인해주세요.');
                return;
            }
            toast.success('카카오/이메일 재발송을 완료했습니다.');
        } catch (error) {
            console.error('Selection notification resend error:', error);
            toast.error('재발송 중 오류가 발생했습니다.');
        }
    };

    const groupedApplicants = applicants.reduce((acc, applicant) => {
        const campaignId = applicant.campaign.id;
        const existingGroup = acc.get(campaignId);

        if (existingGroup) {
            existingGroup.items.push(applicant);
            return acc;
        }

        acc.set(campaignId, {
            campaign: applicant.campaign,
            items: [applicant]
        });

        return acc;
    }, new Map<number, { campaign: Applicant['campaign']; items: Applicant[] }>());

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Suspense fallback={<div className="w-[280px] lg:static fixed h-screen bg-white" />}>
                <DashboardSidebar
                    userType="ADVERTISER"
                    userName={profile?.company_name || profile?.nickname || '광고주'}
                    links={ADVERTISER_LINKS}
                />
            </Suspense>
            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">신청자 목록</h1>
                    <p className="text-gray-500 mb-8">선택한 캠페인에 지원한 리뷰어들을 확인하고 선정하세요.</p>

                    {loading ? (
                        <div className="text-center py-20">Loading...</div>
                    ) : applicants.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                            <p className="text-gray-500">아직 신청한 리뷰어가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Array.from(groupedApplicants.values()).map(({ campaign, items }) => {
                                const pendingCount = items.filter((item) => item.status === 'PENDING').length;
                                const selectedCount = items.filter((item) => item.status === 'SELECTED' || item.status === 'APPROVED').length;
                                const rejectedCount = items.filter((item) => item.status === 'REJECTED').length;

                                return (
                                    <section key={campaign.id} className="space-y-4">
                                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h2 className="text-2xl font-black text-gray-900">{campaign.title}</h2>
                                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                                                            신청 {items.length}명
                                                        </span>
                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                                                            선정 {selectedCount}명
                                                        </span>
                                                        {pendingCount > 0 && (
                                                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
                                                                대기 {pendingCount}명
                                                            </span>
                                                        )}
                                                        {rejectedCount > 0 && (
                                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
                                                                거절 {rejectedCount}명
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        같은 캠페인 신청자를 한 묶음으로 보고 바로 선정, 거절, 배송 후속 작업까지 처리할 수 있게 정리했습니다.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 text-center text-sm">
                                                    <div>
                                                        <div className="text-xs font-semibold text-gray-400">캠페인 유형</div>
                                                        <div className="mt-1 font-bold text-gray-900">{campaign.type}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold text-gray-400">모집 상태</div>
                                                        <div className="mt-1 font-bold text-gray-900">{campaign.is_always ? '상시' : '일반'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold text-gray-400">마감일</div>
                                                        <div className="mt-1 font-bold text-gray-900">
                                                            {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                            <div className="hidden grid-cols-[minmax(220px,1.3fr)_minmax(260px,1.6fr)_minmax(160px,0.8fr)_minmax(200px,1fr)] gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 text-sm font-bold text-gray-500 lg:grid">
                                                <div>신청자</div>
                                                <div>신청 내용</div>
                                                <div>상태</div>
                                                <div className="text-right">액션</div>
                                            </div>

                                            <div className="divide-y divide-gray-100">
                                                {items.map((app) => {
                                                    const isSelectedStatus = app.status === 'SELECTED' || app.status === 'APPROVED';
                                                    const individualLinkCampaign = isIndividualLinkCampaign(app);
                                                    const statusMeta = getApplicantStatusMeta(app);

                                                    return (
                                                        <div
                                                            key={app.id}
                                                            className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(220px,1.3fr)_minmax(260px,1.6fr)_minmax(160px,0.8fr)_minmax(200px,1fr)] lg:items-start"
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xl">
                                                                    {app.user.avatar_url ? (
                                                                        <img
                                                                            src={app.user.avatar_url}
                                                                            alt={app.user.nickname}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        '👤'
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 space-y-2">
                                                                    <div>
                                                                        <div className="text-lg font-black text-gray-900">{app.user.nickname}</div>
                                                                        <div className="text-xs text-gray-400">
                                                                            신청일 {new Date(app.created_at).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 text-xs text-blue-600">
                                                                        {app.user.blog_url && (
                                                                            <a
                                                                                href={app.user.blog_url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="inline-flex items-center gap-1 hover:underline"
                                                                            >
                                                                                블로그 <ExternalLink size={10} />
                                                                            </a>
                                                                        )}
                                                                        {app.user.instagram_url && (
                                                                            <a
                                                                                href={app.user.instagram_url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="inline-flex items-center gap-1 hover:underline"
                                                                            >
                                                                                인스타 <ExternalLink size={10} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {app.selected_option && (
                                                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                                                            신청 옵션: {app.selected_option}
                                                                        </span>
                                                                    )}
                                                                    {app.assigned_option_label && (
                                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                                            확정 옵션: {app.assigned_option_label}
                                                                        </span>
                                                                    )}
                                                                    {app.assigned_purchase_link_url && (
                                                                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                                                            링크 할당 완료
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                                                    {app.application_message || '지원 메시지가 없습니다.'}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusMeta.className}`}>
                                                                        {statusMeta.label}
                                                                    </span>
                                                                    {app.extension_status === 'PENDING' && (
                                                                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
                                                                            연장 요청
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {app.review_deadline && (
                                                                    <div className="text-xs font-medium text-gray-500">
                                                                        리뷰 마감 {new Date(app.review_deadline).toLocaleDateString()}
                                                                    </div>
                                                                )}

                                                                {app.extension_status === 'PENDING' && (
                                                                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                                                                        <p className="mb-2 text-xs font-medium italic text-orange-800">
                                                                            "{app.extension_reason}"
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            <button
                                                                                onClick={() => handleExtensionAction(app.id, 'APPROVED')}
                                                                                className="rounded-md bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-orange-600"
                                                                            >
                                                                                승인(+7일)
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleExtensionAction(app.id, 'REJECTED')}
                                                                                className="rounded-md bg-gray-400 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-gray-500"
                                                                            >
                                                                                거절
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col items-start gap-2 lg:items-end">
                                                                {app.status === 'PENDING' ? (
                                                                    <div className="flex flex-wrap gap-2 lg:justify-end">
                                                                        <button
                                                                            onClick={() => handleStatusChange(app.id, 'SELECTED')}
                                                                            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                                                                        >
                                                                            선정하기
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleStatusChange(app.id, 'REJECTED')}
                                                                            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                                                        >
                                                                            거절
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-start gap-2 text-sm lg:items-end">
                                                                        {isSelectedStatus && app.campaign.type === 'DELIVERY' && (
                                                                            <button
                                                                                onClick={() => setEditingTracking({
                                                                                    applicationId: app.id,
                                                                                    company: app.tracking_company || '',
                                                                                    number: app.tracking_number || ''
                                                                                })}
                                                                                className="font-semibold text-blue-600 hover:underline"
                                                                            >
                                                                                {app.tracking_number ? '운송장 수정' : '운송장 입력'}
                                                                            </button>
                                                                        )}

                                                                        {isSelectedStatus && (
                                                                            <button
                                                                                onClick={() => handleResendSelectionNotification(app)}
                                                                                className="font-semibold text-rose-600 hover:underline"
                                                                            >
                                                                                알림 재발송
                                                                            </button>
                                                                        )}

                                                                        {isSelectedStatus && individualLinkCampaign && (
                                                                            <button
                                                                                onClick={() => openSelectionModal(app, 'REASSIGN')}
                                                                                className="font-semibold text-indigo-600 hover:underline"
                                                                            >
                                                                                링크 재할당
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 운송장 입력 모달 (단순 구현) */}
            {editingTracking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">운송장 정보 입력</h2>
                        <form onSubmit={handleTrackingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">택배사</label>
                                <input
                                    type="text"
                                    required
                                    value={editingTracking.company}
                                    onChange={e => setEditingTracking({ ...editingTracking, company: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="예: CJ대한통운, 로젠택배"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">운송장 번호</label>
                                <input
                                    type="text"
                                    required
                                    value={editingTracking.number}
                                    onChange={e => setEditingTracking({ ...editingTracking, number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="하이픈(-) 없이 숫자만 입력"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                >
                                    저장 및 알림톡 발송
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingTracking(null)}
                                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSelectionModalOpen && selectionTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-2">
                            {selectionMode === 'REASSIGN' ? '구매링크 재할당' : '선정 옵션 및 링크 배정'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {selectionTarget.user.nickname}님의 확정 옵션을 선택하세요.
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
                                        if (isIndividualLinkCampaign(selectionTarget)) {
                                            await fetchLinkCandidates(selectionTarget.campaign.id, value);
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

                            {isIndividualLinkCampaign(selectionTarget) ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        링크 배정 방식
                                    </label>
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
                            <button
                                type="button"
                                onClick={handleSelectionSubmit}
                                disabled={isSelectionSubmitting}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {isSelectionSubmitting
                                    ? '처리 중...'
                                    : selectionMode === 'REASSIGN'
                                        ? '재할당 실행'
                                        : '선정 확정'}
                            </button>
                            <button
                                type="button"
                                onClick={closeSelectionModal}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
