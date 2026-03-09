'use client';

import { Suspense, useState, useEffect } from 'react';
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

export default function AdvertiserApplicantsPage() {
    const { user, profile, isLoading } = useAuthStore();
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

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Suspense fallback={<div className="w-[280px] lg:static fixed h-screen bg-white" />}>
                <DashboardSidebar
                    userType="ADVERTISER"
                    userName={profile?.company_name || profile?.nickname || '광고주'}
                    links={ADVERTISER_LINKS.map(link => ({
                        ...link,
                        active: link.href === '/dashboard/advertiser/applicants'
                    }))}
                />
            </Suspense>
            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">신청자 목록</h1>
                    <p className="text-gray-500 mb-8">내 캠페인에 지원한 리뷰어들을 확인하고 선정하세요.</p>

                    {loading ? (
                        <div className="text-center py-20">Loading...</div>
                    ) : applicants.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                            <p className="text-gray-500">아직 신청한 리뷰어가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {applicants.map((app) => {
                                const isSelectedStatus = app.status === 'SELECTED' || app.status === 'APPROVED';
                                const individualLinkCampaign = isIndividualLinkCampaign(app);

                                return (
                                <div key={app.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                                            {app.user.avatar_url ? <img src={app.user.avatar_url} className="w-full h-full rounded-full object-cover" /> : '👤'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-lg">{app.user.nickname}</span>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                                    {app.campaign.title}
                                                </span>
                                            </div>
                                            
                                            {/* 옵션 및 메시지 표시부 */}
                                            <div className="space-y-1.5 mb-2">
                                                {app.selected_option && (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 uppercase">Option</span>
                                                        <span className="text-xs font-semibold text-blue-700">{app.selected_option}</span>
                                                    </div>
                                                )}
                                                {app.assigned_option_label && (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 uppercase">Assigned</span>
                                                        <span className="text-xs font-semibold text-emerald-700">{app.assigned_option_label}</span>
                                                    </div>
                                                )}
                                                {app.assigned_purchase_link_url && (
                                                    <span className="text-xs text-indigo-600 font-semibold">
                                                        개별 링크 할당 완료
                                                    </span>
                                                )}
                                                <div className="text-sm text-gray-600 line-clamp-2">{app.application_message || '지원 메시지가 없습니다.'}</div>
                                            </div>

                                            <div className="flex gap-2 text-xs text-blue-600">
                                                {app.user.blog_url && <a href={app.user.blog_url} target="_blank" className="hover:underline flex items-center gap-1">블로그 <ExternalLink size={10}/></a>}
                                                {app.user.instagram_url && <a href={app.user.instagram_url} target="_blank" className="hover:underline flex items-center gap-1">인스타 <ExternalLink size={10}/></a>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {app.status === 'PENDING' ? (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(app.id, 'SELECTED')}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                                >
                                                    선정하기
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(app.id, 'REJECTED')}
                                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                                >
                                                    거절
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2">
                                                    {app.extension_status === 'PENDING' && (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-bold animate-pulse">
                                                            연장 요청됨
                                                        </span>
                                                    )}
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${isSelectedStatus ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {isSelectedStatus ? '선정됨' : '거절됨'}
                                                    </span>
                                                </div>
                                                
                                                {app.extension_status === 'PENDING' && (
                                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-1 max-w-[250px] text-right">
                                                        <p className="text-xs text-orange-800 font-medium mb-2 italic">"{app.extension_reason}"</p>
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleExtensionAction(app.id, 'APPROVED')}
                                                                className="text-[10px] bg-orange-500 text-white px-2 py-1 rounded-md font-bold hover:bg-orange-600"
                                                            >
                                                                승인(+7일)
                                                            </button>
                                                            <button 
                                                                onClick={() => handleExtensionAction(app.id, 'REJECTED')}
                                                                className="text-[10px] bg-gray-400 text-white px-2 py-1 rounded-md font-bold hover:bg-gray-500"
                                                            >
                                                                거절
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {isSelectedStatus && app.campaign.type === 'DELIVERY' && (
                                                    <button
                                                        onClick={() => setEditingTracking({
                                                            applicationId: app.id,
                                                            company: app.tracking_company || '',
                                                            number: app.tracking_number || ''
                                                        })}
                                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        {app.tracking_number ? '운송장 수정' : '운송장 입력'}
                                                    </button>
                                                )}

                                                {isSelectedStatus && (
                                                    <button
                                                        onClick={() => handleResendSelectionNotification(app)}
                                                        className="text-xs text-rose-600 hover:underline"
                                                    >
                                                        알림 재발송
                                                    </button>
                                                )}

                                                {isSelectedStatus && individualLinkCampaign && (
                                                    <button
                                                        onClick={() => openSelectionModal(app, 'REASSIGN')}
                                                        className="text-xs text-indigo-600 hover:underline"
                                                    >
                                                        링크 재할당
                                                    </button>
                                                )}
                                                
                                                {app.review_deadline && (
                                                    <div className="text-[10px] text-gray-400">
                                                        마감: {new Date(app.review_deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
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
