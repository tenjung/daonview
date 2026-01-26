'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Check, X, Phone, Instagram, ExternalLink, Star, Download, Truck, Upload, Save } from 'lucide-react';
import ApplicationStatusBadge from '@/components/admin/ApplicationStatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import InfluencerReviewModal from './InfluencerReviewModal';
import InfluencerReviewTags from './InfluencerReviewTags';
import BulkActionsBar from './BulkActionsBar';
import InfluencerStatsCard from './InfluencerStatsCard';
import { Application, InfluencerReview, InfluencerStats } from '@/types/database';
import { ApplicationExportData } from '@/types/review';
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
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
    const [influencerStats, setInfluencerStats] = useState<Map<string, InfluencerStats>>(new Map());
    const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set());
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
        loadInfluencerStats();
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

    // 인플루언서 통계 데이터 로드
    const loadInfluencerStats = async () => {
        const influencerIds = initialApplications.map(app => app.user_id).filter(Boolean);
        if (influencerIds.length === 0) return;

        const { data, error } = await supabase
            .from('influencer_stats')
            .select('*')
            .in('user_id', influencerIds);

        if (!error && data) {
            const statsMap = new Map<string, InfluencerStats>();
            data.forEach(stat => {
                statsMap.set(stat.user_id, stat);
            });
            setInfluencerStats(statsMap);
        }
    };

    // 블로그 크롤링 실행
    const crawlBlog = async (userId: string, blogUrl: string) => {
        setLoadingStats(prev => new Set(prev).add(userId));

        try {
            const response = await fetch('/api/crawl-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, blogUrl })
            });

            const result = await response.json();

            if (result.success && result.data) {
                setInfluencerStats(prev => {
                    const newMap = new Map(prev);
                    newMap.set(userId, result.data);
                    return newMap;
                });
                toast.success('블로그 분석이 완료되었습니다.');
            } else {
                toast.error('블로그 분석에 실패했습니다.');
            }
        } catch (error) {
            console.error('Crawl error:', error);
            toast.error('블로그 분석 중 오류가 발생했습니다.');
        } finally {
            setLoadingStats(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    // 필터링된 신청자 목록
    const filteredApplications = applications.filter(app => {
        if (filter === 'all') return true;
        return app.status?.toUpperCase() === filter.toUpperCase();
    });

    // 송장 정보 업데이트
    const handleUpdateTracking = async (applicationId: number, company: string, number: string) => {
        if (!company || !number) {
            toast.error('택배사와 송장 번호를 모두 입력해주세요.');
            return;
        }

        try {
            const { error } = await supabase
                .from('applications')
                .update({
                    tracking_company: company,
                    tracking_number: number,
                    shipped_at: new Date().toISOString()
                })
                .eq('id', applicationId);

            if (error) throw error;

            toast.success('송장 정보가 저장되었습니다.');
            
            // 알림 발송 로직 (백그라운드)
            const app = applications.find(a => a.id === applicationId);
            if (app?.user_id) {
                await supabase.from('notifications').insert({
                    user_id: app.user_id,
                    type: 'CAMPAIGN_SHIPPING',
                    title: '📦 제품 발송 안내',
                    content: `[${campaignTitle}] 캠페인의 제품이 발송되었습니다. 송장번호를 확인해 주세요.`,
                    link: '/dashboard/influencer/campaigns'
                });

                // 이메일 발송 추가
                if (app.user?.email) {
                    triggerEmail(app.user.email, 'PRODUCT_SHIPPED', {
                        nickname: app.user.nickname,
                        campaignTitle,
                        trackingCompany: company,
                        trackingNumber: number
                    });
                }
            }

            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId
                        ? { ...app, tracking_company: company, tracking_number: number }
                        : app
                )
            );
        } catch (error) {
            console.error('Error updating tracking:', error);
            toast.error('송장 정보 저장 중 오류가 발생했습니다.');
        }
    };

    // 엑셀 일괄 등록 (송장)
    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                let successCount = 0;
                for (const row of data) {
                    const id = row['ID'] || row['id'] || row['신청번호'];
                    const company = row['택배사'] || row['tracking_company'];
                    const number = row['송장번호'] || row['tracking_number'];

                    if (id && company && number) {
                        const { error } = await supabase
                            .from('applications')
                            .update({
                                tracking_company: company,
                                tracking_number: number,
                                shipped_at: new Date().toISOString()
                            })
                            .eq('id', id);
                        
                        if (!error) successCount++;
                    }
                }

                toast.success(`${successCount}건의 송장 정보가 일괄 등록되었습니다.`);
                // 데이터 새로고침
                window.location.reload();
            } catch (err) {
                console.error('Excel import error:', err);
                toast.error('엑셀 파일 처리 중 오류가 발생했습니다.');
            }
        };
        reader.readAsBinaryString(file);
    };

    // 이메일 발송 공통 함수
    const triggerEmail = async (to: string, type: string, params: any) => {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, type, params })
            });

            if (!response.ok) {
                console.error(`Failed to send ${type} email:`, await response.text());
            }
        } catch (error) {
            console.error(`Error sending ${type} email:`, error);
        }
    };

    // 승인 처리
    const handleApprove = (applicationId: number, userName: string, userEmail: string) => {
        const approvedCount = applications.filter(app => app.status?.toUpperCase() === 'APPROVED').length;

        setConfirmModal({
            isOpen: true,
            title: '신청 승인',
            message: `${userName}님의 신청을 승인하시겠습니까?\n승인 시 이메일 알림이 발송됩니다.\n\n현재 승인된 인원: ${approvedCount}/${recruitCount}명`,
            type: 'info',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('applications')
                    .update({ status: 'APPROVED' })
                    .eq('id', applicationId);

                if (error) {
                    toast.error('승인 처리 중 오류가 발생했습니다.');
                    console.error(error);
                } else {
                    toast.success(`${userName}님의 신청이 승인되었습니다.`);

                    // 알림 전송 (승인)
                    const app = applications.find(a => a.id === applicationId);
                    if (app?.user_id) {
                        await supabase.from('notifications').insert({
                            user_id: app.user_id,
                            type: 'CAMPAIGN_SELECTED',
                            title: '✨ 캠페인 선정 안내',
                            content: `축하합니다! [${campaignTitle}] 캠페인에 선정되셨습니다.`,
                            link: '/dashboard/influencer/campaigns'
                        });
                    }

                    // 이메일 발송
                    triggerEmail(userEmail, 'CAMPAIGN_SELECTED', {
                        nickname: userName,
                        campaignTitle,
                        campaignId
                    });

                    // 낙관적 UI 업데이트
                    setApplications(prev =>
                        prev.map(app =>
                            app.id === applicationId
                                ? { ...app, status: 'APPROVED' }
                                : app
                        )
                    );
                }
            }
        });
    };

    // 거절 처리
    const handleReject = (applicationId: number, userName: string) => {
        setConfirmModal({
            isOpen: true,
            title: '신청 거절',
            message: `${userName}님의 신청을 거절하시겠습니까?\n거절된 신청은 다시 되돌릴 수 없습니다.`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('applications')
                    .update({ status: 'REJECTED' })
                    .eq('id', applicationId);

                if (error) {
                    toast.error('거절 처리 중 오류가 발생했습니다.');
                    console.error(error);
                } else {
                    toast.success(`${userName}님의 신청이 거절되었습니다.`);

                    setApplications(prev =>
                        prev.map(app =>
                            app.id === applicationId
                                ? { ...app, status: 'REJECTED' }
                                : app
                        )
                    );
                }
            }
        });
    };

    // 일괄 승인
    const handleBulkApprove = () => {
        const selectedApps = applications.filter(app => selectedIds.includes(app.id));
        const pendingApps = selectedApps.filter(app => app.status?.toUpperCase() === 'PENDING');

        if (pendingApps.length === 0) {
            toast.error('승인 가능한 신청이 없습니다.');
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: '일괄 승인',
            message: `선택한 ${pendingApps.length}명의 신청을 승인하시겠습니까?\n승인 시 이메일 알림이 발송됩니다.`,
            type: 'info',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('applications')
                    .update({ status: 'APPROVED' })
                    .in('id', pendingApps.map(app => app.id));

                if (error) {
                    toast.error('일괄 승인 처리 중 오류가 발생했습니다.');
                    console.error(error);
                } else {
                    toast.success(`${pendingApps.length}명의 신청이 승인되었습니다.`);

                    // 이메일 발송
                    pendingApps.forEach(app => {
                        if (app.user?.email && app.user?.nickname) {
                            triggerEmail(app.user.email, 'CAMPAIGN_SELECTED', {
                                nickname: app.user.nickname,
                                campaignTitle,
                                campaignId
                            });
                        }
                    });

                    setApplications(prev =>
                        prev.map(app =>
                            pendingApps.find(p => p.id === app.id)
                                ? { ...app, status: 'APPROVED' }
                                : app
                        )
                    );
                    setSelectedIds([]);
                }
            }
        });
    };

    // 일괄 거절
    const handleBulkReject = () => {
        const selectedApps = applications.filter(app => selectedIds.includes(app.id));
        const pendingApps = selectedApps.filter(app => app.status?.toUpperCase() === 'PENDING');

        if (pendingApps.length === 0) {
            toast.error('거절 가능한 신청이 없습니다.');
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: '일괄 거절',
            message: `선택한 ${pendingApps.length}명의 신청을 거절하시겠습니까?\n거절된 신청은 다시 되돌릴 수 없습니다.`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('applications')
                    .update({ status: 'REJECTED' })
                    .in('id', pendingApps.map(app => app.id));

                if (error) {
                    toast.error('일괄 거절 처리 중 오류가 발생했습니다.');
                    console.error(error);
                } else {
                    toast.success(`${pendingApps.length}명의 신청이 거절되었습니다.`);
                    setApplications(prev =>
                        prev.map(app =>
                            pendingApps.find(p => p.id === app.id)
                                ? { ...app, status: 'REJECTED' }
                                : app
                        )
                    );
                    setSelectedIds([]);
                }
            }
        });
    };

    // Excel 다운로드
    const handleExportExcel = () => {
        const selectedApps = selectedIds.length > 0
            ? applications.filter(app => selectedIds.includes(app.id))
            : filteredApplications;

        if (selectedApps.length === 0) {
            toast.error('내보낼 데이터가 없습니다.');
            return;
        }

        const exportData: ApplicationExportData[] = selectedApps.map(app => ({
            신청일시: new Date(app.created_at).toLocaleString('ko-KR'),
            이름: app.user?.nickname || '이름 없음',
            이메일: app.user?.email || '미등록',
            연락처: app.user?.phone_number || '미등록',
            SNS: app.user?.sns_url || '미등록',
            상태: app.status === 'PENDING' ? '대기중' : app.status === 'APPROVED' ? '승인됨' : app.status === 'REJECTED' ? '거절됨' : '알 수 없음',
            신청메시지: app.message || '메시지 없음',
            평가태그: influencerReviews.get(app.user_id)?.join(', ') || '평가 없음'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '신청자 목록');

        const fileName = `${campaignTitle}_신청자목록_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toast.success(`${selectedApps.length}명의 데이터가 다운로드되었습니다.`);
        setSelectedIds([]);
    };

    // 체크박스 토글
    const handleCheckboxToggle = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    // 전체 선택/해제
    const handleSelectAll = () => {
        if (selectedIds.length === filteredApplications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredApplications.map(app => app.id));
        }
    };

    // 필터 탭 렌더링
    const renderFilterTabs = () => {
        const tabs: { key: FilterType; label: string; count: number }[] = [
            { key: 'all', label: '전체', count: applications.length },
            { key: 'pending', label: '대기중', count: applications.filter(app => app.status?.toUpperCase() === 'PENDING').length },
            { key: 'approved', label: '승인됨', count: applications.filter(app => app.status?.toUpperCase() === 'APPROVED').length },
            { key: 'rejected', label: '거절됨', count: applications.filter(app => app.status?.toUpperCase() === 'REJECTED').length },
        ];

        return (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.key
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === tab.key
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {filteredApplications.length > 0 && (
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer">
                            <Upload size={16} />
                            송장 일괄 등록 (Excel)
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
                        </label>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            <Download size={16} />
                            Excel 다운로드
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (filteredApplications.length === 0) {
        const getEmptyMessage = () => {
            switch (filter) {
                case 'pending': return '대기 중인 신청이 없습니다.';
                case 'approved': return '승인된 신청이 없습니다.';
                case 'rejected': return '거절된 신청이 없습니다.';
                default: return '아직 신청자가 없습니다.';
            }
        };

        return (
            <>
                {renderFilterTabs()}
                <div className="p-20 text-center text-gray-400 flex flex-col items-center bg-white">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="text-lg font-medium">{getEmptyMessage()}</p>
                </div>
            </>
        );
    }

    return (
        <>
            {renderFilterTabs()}

            <div className="overflow-x-auto bg-white">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-y border-gray-200">
                        <tr>
                            <th className="px-6 py-4 w-[50px]">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === filteredApplications.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-4 min-w-[120px]">신청일시</th>
                            <th className="px-6 py-4 min-w-[200px]">인플루언서 정보</th>
                            <th className="px-6 py-4 min-w-[150px]">블로그 통계</th>
                            <th className="px-6 py-4 min-w-[150px]">연락처</th>
                            <th className="px-6 py-4 min-w-[120px]">SNS</th>
                            <th className="px-6 py-4 min-w-[200px]">신청 메시지</th>
                            <th className="px-6 py-4 min-w-[180px]">송장 정보</th>
                            <th className="px-6 py-4 min-w-[100px]">상태</th>
                            <th className="px-6 py-4 text-center min-w-[100px]">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredApplications.map((app) => {
                            const user = app.user;
                            const isPending = app.status?.toUpperCase() === 'PENDING';
                            const userReviews = influencerReviews.get(app.user_id) || [];
                            const userStats = influencerStats.get(app.user_id);
                            const isLoadingStats = loadingStats.has(app.user_id);

                            return (
                                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(app.id)}
                                            onChange={() => handleCheckboxToggle(app.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(app.created_at).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {user?.nickname?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        {user?.nickname || '이름 없음'}
                                                    </span>
                                                    {userReviews.length > 0 && (
                                                        <button
                                                            onClick={() => setReviewModal({
                                                                isOpen: true,
                                                                influencerId: app.user_id,
                                                                influencerName: user?.nickname || '인플루언서'
                                                            })}
                                                            className="text-yellow-500 hover:text-yellow-600"
                                                            title="평가 보기"
                                                        >
                                                            <Star size={14} fill="currentColor" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {user?.email}
                                                </div>
                                                {userReviews.length > 0 && (
                                                    <div className="mt-1">
                                                        <InfluencerReviewTags tags={userReviews.slice(0, 3)} compact />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <InfluencerStatsCard
                                            stats={userStats || null}
                                            loading={isLoadingStats}
                                            onRefresh={user?.sns_url ? () => crawlBlog(app.user_id, user.sns_url!) : undefined}
                                            campaignTitle={campaignTitle}
                                            campaignCategory={campaignCategory}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        {user?.phone_number ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Phone size={14} className="text-gray-400" />
                                                {user.phone_number}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">미등록</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user?.sns_url ? (
                                            <a
                                                href={user.sns_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                                            >
                                                <Instagram size={14} />
                                                SNS 보기
                                                <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">미등록</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-sm text-gray-700 line-clamp-2">
                                            {app.message || '메시지 없음'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {app.status?.toUpperCase() === 'APPROVED' && (
                                            <div className="flex flex-col gap-1.5 min-w-[150px]">
                                                <input 
                                                    type="text" 
                                                    placeholder="택배사" 
                                                    defaultValue={app.tracking_company || ''}
                                                    onBlur={(e) => app.temp_company = e.target.value}
                                                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                                                />
                                                <div className="flex gap-1">
                                                    <input 
                                                        type="text" 
                                                        placeholder="송장번호" 
                                                        defaultValue={app.tracking_number || ''}
                                                        onBlur={(e) => app.temp_number = e.target.value}
                                                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none flex-1"
                                                    />
                                                    <button 
                                                        onClick={() => handleUpdateTracking(app.id, app.temp_company || app.tracking_company, app.temp_number || app.tracking_number)}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-600"
                                                        title="저장"
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ApplicationStatusBadge status={app.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            {isPending ? (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(app.id, user?.nickname || '사용자', user?.email || '')}
                                                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-bold text-xs shadow-sm"
                                                    >
                                                        <Check size={14} /> 승인
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(app.id, user?.nickname || '사용자')}
                                                        className="flex items-center gap-1 bg-white text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-medium text-xs"
                                                    >
                                                        <X size={14} /> 거절
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => setReviewModal({
                                                            isOpen: true,
                                                            influencerId: app.user_id,
                                                            influencerName: user?.nickname || '인플루언서'
                                                        })}
                                                        className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors font-bold text-xs shadow-sm"
                                                    >
                                                        <Star size={14} /> 평가
                                                    </button>
                                                    {app.review_submitted && (
                                                        <button 
                                                            onClick={() => {
                                                                // Simple alert or nested modal to show review info
                                                                const mediaCount = app.review_media_urls?.length || 0;
                                                                toast.info(`리뷰 확인: ${mediaCount}개의 미디어가 등록됨`, {
                                                                    description: `URL: ${app.reviews?.[0]?.post_url || 'N/A'}`
                                                                });
                                                            }}
                                                            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors font-bold text-xs shadow-sm"
                                                        >
                                                            <ExternalLink size={14} /> 리뷰 확인
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 일괄 처리 바 */}
            <BulkActionsBar
                selectedCount={selectedIds.length}
                onApproveSelected={handleBulkApprove}
                onRejectSelected={handleBulkReject}
                onExportExcel={handleExportExcel}
                onClearSelection={() => setSelectedIds([])}
            />

            {/* 평가 모달 */}
            <InfluencerReviewModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal({ isOpen: false, influencerId: '', influencerName: '' })}
                influencerId={reviewModal.influencerId}
                influencerName={reviewModal.influencerName}
                campaignId={parseInt(campaignId)}
                onReviewAdded={loadInfluencerReviews}
            />

            {/* 확인 다이얼로그 */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.title.includes('승인') ? '승인하기' : '거절하기'}
            />
        </>
    );
}
