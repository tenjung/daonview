'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';

interface AdminDashboardClientProps {
    initialCampaigns: CampaignRow[];
}

interface CampaignRow {
    id: number;
    title: string;
    end_date: string;
    recruit_count: number;
    is_always?: boolean;
    profiles?: {
        company_name?: string | null;
        nickname?: string | null;
        email?: string | null;
        role?: string | null;
    } | null;
    applications?: Array<{ count: number }>;
}

const BULK_EXTEND_TIMEOUT_MS = 15000;
const EXTEND_RETRY_TIMEOUT_MS = 35000;

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timeout (${timeoutMs}ms)`)), timeoutMs)
        ),
    ]);
}

function isTimeoutError(error: unknown): error is Error {
    return error instanceof Error && error.message.includes('timeout');
}

export default function AdminDashboardClient({ initialCampaigns }: AdminDashboardClientProps) {
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [isBulkExtending, setIsBulkExtending] = useState(false);
    const [quickExtendingId, setQuickExtendingId] = useState<number | null>(null);
    const { user } = useAuthStore();

    // 지능형 모니터링 및 알림 (관리자용)
    useEffect(() => {
        if (campaigns.length > 0 && user) {
            const checkAndNotify = async () => {
                for (const campaign of campaigns) {
                    const analysis = analyzeCampaignRisk(campaign);
                    if (analysis.riskLevel === 'critical') {
                        // 중복 알림 방지 (24시간 내)
                        const { count } = await supabase
                            .from('notifications')
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', user.id)
                            .eq('type', 'ADMIN_CAMPAIGN_CRITICAL')
                            .ilike('content', `%[${campaign.title}]%`)
                            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

                        if (count === 0) {
                            await supabase.from('notifications').insert({
                                user_id: user.id,
                                type: 'ADMIN_CAMPAIGN_CRITICAL',
                                title: '🚨 [관리자] 캠페인 긴급 지원 필요',
                                content: `[${campaign.title}] 캠페인이 마감 임박하였으나 모집이 매우 저조합니다.`,
                                link: `/dashboard/admin?id=${campaign.id}`
                            });
                        }
                    }
                }
            };
            checkAndNotify();
        }
    }, [campaigns, user]);

    // 캠페인 위험도 분석
    function analyzeCampaignRisk(campaign: CampaignRow) {
        const applicantCount = campaign.applications?.[0]?.count || 0;
        const targetCount = campaign.recruit_count;
        const applicationRate = (applicantCount / targetCount) * 100;

        const endDate = new Date(campaign.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isAlways = campaign.is_always || campaign.recruit_count >= 999 || campaign.end_date?.startsWith('9999');

        let riskLevel: 'critical' | 'warning' | 'normal' = 'normal';

        if (isAlways) {
            riskLevel = 'normal'; // 상시는 시급성 부족
        } else if (daysLeft <= 3 && applicationRate < 50) {
            riskLevel = 'critical';
        } else if (daysLeft <= 3 || applicationRate < 50) {
            riskLevel = 'warning';
        }

        return {
            applicantCount,
            targetCount,
            applicationRate,
            daysLeft,
            riskLevel,
            isAlways
        };
    }

    const criticalCampaigns = campaigns.filter(c => analyzeCampaignRisk(c).riskLevel === 'critical');
    const warningCampaigns = campaigns.filter(c => analyzeCampaignRisk(c).riskLevel === 'warning');

    async function updateCampaignEndDateWithRetry(campaignId: number, days: number): Promise<string> {
        const requestExtend = async () => {
            const response = await fetch('/api/campaigns/extend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId, days }),
            });

            const payload = await response.json().catch(() => ({} as Record<string, unknown>));
            if (!response.ok) {
                const errorMessage = typeof payload.error === 'string' ? payload.error : '기간 연장 요청에 실패했습니다.';
                throw new Error(errorMessage);
            }

            const endDate = typeof payload.endDate === 'string' ? payload.endDate : '';
            if (!endDate) {
                throw new Error('연장 결과(endDate)를 받지 못했습니다.');
            }

            return endDate;
        };

        try {
            return await withTimeout<string>(
                requestExtend(),
                BULK_EXTEND_TIMEOUT_MS,
                `extend campaign ${campaignId}`
            );
        } catch (error) {
            if (!isTimeoutError(error)) throw error;
        }

        return withTimeout<string>(
            requestExtend(),
            EXTEND_RETRY_TIMEOUT_MS,
            `retry extend campaign ${campaignId}`
        );
    }

    async function handleBulkExtend(days: number) {
        if (isBulkExtending || selectedCampaigns.length === 0) return;

        setIsBulkExtending(true);
        try {
            const failedCampaignIds: number[] = [];

            for (const campaignId of selectedCampaigns) {
                const campaign = campaigns.find(c => c.id === campaignId);
                if (!campaign) continue;

                try {
                    await updateCampaignEndDateWithRetry(campaignId, days);
                } catch (error) {
                    console.error(`캠페인(${campaignId}) 연장 실패:`, error);
                    failedCampaignIds.push(campaignId);
                }
            }

            const successCount = selectedCampaigns.length - failedCampaignIds.length;
            if (successCount > 0) {
                toast.success(`${successCount}개 캠페인의 기간이 ${days}일 연장되었습니다!`);
                setSelectedCampaigns([]);
                setShowBulkModal(false);
            }

            if (failedCampaignIds.length > 0) {
                toast.error(
                    `일부 캠페인 연장 실패 (${failedCampaignIds.length}개)`,
                    {
                        description: `실패 ID: ${failedCampaignIds.join(', ')}`
                    }
                );
            }

            // Re-fetch or update local state
            const { data: refetchData, error: refetchErr } = await withTimeout(
                supabase
                    .from('campaigns')
                    .select('*, applications(count), profiles:created_by(*)')
                    .in('status', ['RECRUITING', 'ONGOING']),
                BULK_EXTEND_TIMEOUT_MS,
                'campaign refetch'
            );
            if (refetchErr) {
                throw refetchErr;
            }
            if (refetchData) setCampaigns(refetchData);

        } catch (error) {
            console.error('일괄 연장 오류:', error);
            const message = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error('일괄 연장 중 오류가 발생했습니다.', {
                description: message,
            });
        } finally {
            setIsBulkExtending(false);
        }
    }

    function toggleCampaignSelection(campaignId: number) {
        setSelectedCampaigns(prev =>
            prev.includes(campaignId)
                ? prev.filter(id => id !== campaignId)
                : [...prev, campaignId]
        );
    }

    async function handleQuickExtend(campaignId: number, days: number) {
        if (quickExtendingId !== null) return;

        setQuickExtendingId(campaignId);
        try {
            const endDate = await updateCampaignEndDateWithRetry(campaignId, days);

            setCampaigns((prev) =>
                prev.map((c) =>
                    c.id === campaignId ? { ...c, end_date: endDate } : c
                )
            );
            toast.success(`캠페인을 ${days}일 연장했습니다.`);
        } catch (error) {
            console.error(`캠페인(${campaignId}) 즉시 연장 오류:`, error);
            const message = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error('즉시 연장에 실패했습니다.', {
                description: message,
            });
        } finally {
            setQuickExtendingId(null);
        }
    }

    return (
        <>
            {/* 위험 신호등 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
                <Card 
                  className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all cursor-pointer group h-full"
                  onClick={() => document.getElementById('critical-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <CardContent className="p-0 h-full">
                        <div className="flex flex-col sm:flex-row items-stretch h-full sm:h-24">
                            <div className="h-1.5 sm:h-auto sm:w-2 shrink-0 bg-red-500" />
                            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center sm:justify-between items-center sm:items-start text-center sm:text-left relative gap-2 sm:gap-0">
                                <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-red-50 text-red-500 flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="sm:hidden p-1.5 rounded-full bg-red-50 text-red-500">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                
                                <div className="flex flex-col w-full sm:pr-14">
                                    <p className="hidden sm:block text-xs font-medium text-gray-500 whitespace-nowrap mb-0.5">🔴 위험 (모집 미달 D-3)</p>
                                    <p className="sm:hidden text-[10px] font-medium text-gray-500 whitespace-nowrap mb-0.5">긴급 조치</p>
                                    <h3 className="text-lg sm:text-2xl font-bold group-hover:scale-105 transition-transform origin-center sm:origin-left text-gray-900 leading-none">{criticalCampaigns.length}<span className="sm:hidden text-[10px] text-gray-500 ml-0.5 font-normal leading-none inline-block align-baseline">건</span><span className="hidden sm:inline-block text-lg font-bold">건</span></h3>
                                </div>
                                <p className="hidden sm:block text-xs text-gray-400 font-medium">즉시 조치 필요</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                  className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all cursor-pointer group h-full"
                  onClick={() => document.getElementById('warning-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <CardContent className="p-0 h-full">
                        <div className="flex flex-col sm:flex-row items-stretch h-full sm:h-24">
                            <div className="h-1.5 sm:h-auto sm:w-2 shrink-0 bg-yellow-400" />
                            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center sm:justify-between items-center sm:items-start text-center sm:text-left relative gap-2 sm:gap-0">
                                <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-yellow-50 text-yellow-500 flex-shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="sm:hidden p-1.5 rounded-full bg-yellow-50 text-yellow-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                
                                <div className="flex flex-col w-full sm:pr-14">
                                    <p className="hidden sm:block text-xs font-medium text-gray-500 whitespace-nowrap mb-0.5">🟡 주의 (마감 임박)</p>
                                    <p className="sm:hidden text-[10px] font-medium text-gray-500 whitespace-nowrap mb-0.5">주의/임박</p>
                                    <h3 className="text-lg sm:text-2xl font-bold group-hover:scale-105 transition-transform origin-center sm:origin-left text-gray-900 leading-none">{warningCampaigns.length}<span className="sm:hidden text-[10px] text-gray-500 ml-0.5 font-normal leading-none inline-block align-baseline">건</span><span className="hidden sm:inline-block text-lg font-bold">건</span></h3>
                                </div>
                                <p className="hidden sm:block text-xs text-gray-400 font-medium">모니터링 필요</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                  className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all cursor-pointer group h-full"
                >
                    <CardContent className="p-0 h-full">
                        <div className="flex flex-col sm:flex-row items-stretch h-full sm:h-24">
                            <div className="h-1.5 sm:h-auto sm:w-2 shrink-0 bg-purple-500" />
                            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center sm:justify-between items-center sm:items-start text-center sm:text-left relative gap-2 sm:gap-0">
                                <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-50 text-purple-500 flex-shrink-0 text-lg">
                                    ⚖️
                                </div>
                                <div className="sm:hidden p-1.5 rounded-full bg-purple-50 text-purple-500 text-sm flex items-center justify-center">
                                    ⚖️
                                </div>
                                
                                <div className="flex flex-col w-full sm:pr-14">
                                    <p className="hidden sm:block text-xs font-medium text-gray-500 whitespace-nowrap mb-0.5">⚖️ 법적 대응</p>
                                    <p className="sm:hidden text-[10px] font-medium text-gray-500 whitespace-nowrap mb-0.5">법적 대응</p>
                                    <h3 className="text-lg sm:text-2xl font-bold group-hover:scale-105 transition-transform origin-center sm:origin-left text-gray-900 leading-none">0<span className="sm:hidden text-[10px] text-gray-500 ml-0.5 font-normal leading-none inline-block align-baseline">건</span><span className="hidden sm:inline-block text-lg font-bold">건</span></h3>
                                </div>
                                <p className="hidden sm:block text-xs text-gray-400 font-medium">먹튀/미제출</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 🔴 긴급: 모집 미달 구조대 */}
            {criticalCampaigns.length > 0 && (
                <div id="critical-section" className="mb-8">
                    <Card className="border-red-200 overflow-visible shadow-sm">
                        <div className="bg-red-50/50 p-4 border-b border-red-100 border-l-4 border-l-red-500 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        🔴 모집 미달 구조대
                                    </h2>
                                    <p className="text-red-700 mt-0.5 text-xs">마감 3일 이내 + 신청률 50% 미만 - 즉시 조치 필요</p>
                                </div>
                                {selectedCampaigns.length > 0 && (
                                    <button
                                        disabled={isBulkExtending}
                                        onClick={() => setShowBulkModal(true)}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        선택한 {selectedCampaigns.length}개 일괄 연장
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-10">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCampaigns(criticalCampaigns.map(c => c.id));
                                                    } else {
                                                        setSelectedCampaigns([]);
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">캠페인명</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">광고주</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">신청 현황</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">마감일</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">긴급 조치</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {criticalCampaigns.map((campaign) => {
                                        const analysis = analyzeCampaignRisk(campaign);
                                        const advertiser = campaign.profiles;
                                        const advertiserName = advertiser?.company_name || advertiser?.nickname || advertiser?.email || '알 수 없음';
                                        const isAdmin = advertiser?.role?.toUpperCase() === 'ADMIN';

                                        return (
                                            <tr key={campaign.id} className="hover:bg-red-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCampaigns.includes(campaign.id)}
                                                        onChange={() => toggleCampaignSelection(campaign.id)}
                                                        className="w-4 h-4"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-gray-900">{campaign.title}</div>
                                                    <div className="text-xs text-gray-500 mt-1">ID: {campaign.id}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="font-medium text-gray-900">{advertiserName}</div>
                                                        {isAdmin && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-bold w-fit">ADMIN</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 w-24">
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-red-500 h-2 rounded-full"
                                                                    style={{ width: `${Math.min(analysis.applicationRate, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                                                            {analysis.applicantCount} / {analysis.targetCount >= 999 ? <span className="text-indigo-600 font-black text-base">∞</span> : `${analysis.targetCount}명`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    {analysis.isAlways ? (
                                                        <span className="text-[11px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">상시모집</span>
                                                    ) : (
                                                        <div className="font-bold text-red-600">D-{analysis.daysLeft}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="relative inline-flex items-center gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    disabled={quickExtendingId !== null}
                                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-bold disabled:opacity-60"
                                                                >
                                                                    {quickExtendingId === campaign.id ? '연장중...' : '즉시 연장'}
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="z-[80] min-w-[170px]">
                                                                <DropdownMenuLabel className="px-2 py-1 text-[11px] text-gray-500 font-semibold">빠른 연장</DropdownMenuLabel>
                                                                {[3, 7, 14].map((days) => (
                                                                    <DropdownMenuItem
                                                                        key={days}
                                                                        disabled={quickExtendingId !== null}
                                                                        onSelect={() => handleQuickExtend(campaign.id, days)}
                                                                        className="px-2 py-1.5 text-xs rounded-md bg-red-50 text-red-700 focus:bg-red-100 font-bold cursor-pointer"
                                                                    >
                                                                        +{days}일
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <Link
                                                            href={`/dashboard/campaign/new?id=${campaign.id}`}
                                                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs font-bold"
                                                        >
                                                            공고 수정
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* 🟡 주의: 마감 임박 */}
            {warningCampaigns.length > 0 && (
                <div id="warning-section" className="mb-8">
                    <Card className="border-yellow-200 overflow-visible shadow-sm bg-white">
                        <div className="bg-yellow-50/50 p-4 border-b border-yellow-100 border-l-4 border-l-yellow-400 rounded-t-xl">
                            <h2 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                🟡 주의: 마감 임박 / 신청률 저조
                            </h2>
                        </div>
                        <div className="p-4 grid gap-3">
                            {warningCampaigns.map((campaign) => {
                                const analysis = analyzeCampaignRisk(campaign);
                                return (
                                    <Card key={campaign.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-all">
                                        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-0.5 text-sm">{campaign.title}</h3>
                                            <div className="text-sm text-gray-500">
                                                신청 현황: {analysis.isAlways ? <span className="text-rose-500 font-extrabold">{analysis.applicantCount}</span> : `${analysis.applicantCount}/${analysis.targetCount}명 (${Math.round(analysis.applicationRate)}%)`} |
                                                <span className="ml-2 font-bold text-yellow-600">
                                                    {analysis.isAlways ? (
                                                        <span className="text-[11px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">상시모집</span>
                                                    ) : `D-${analysis.daysLeft}`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        disabled={quickExtendingId !== null}
                                                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-bold disabled:opacity-60"
                                                    >
                                                        {quickExtendingId === campaign.id ? '연장중...' : '즉시 연장'}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="z-[80] min-w-[190px]">
                                                    <DropdownMenuLabel className="px-2 py-1 text-[11px] text-gray-500 font-semibold">빠른 연장</DropdownMenuLabel>
                                                    {[3, 7, 14].map((days) => (
                                                        <DropdownMenuItem
                                                            key={days}
                                                            disabled={quickExtendingId !== null}
                                                            onSelect={() => handleQuickExtend(campaign.id, days)}
                                                            className="px-2 py-1.5 text-xs rounded-md bg-yellow-50 text-yellow-700 focus:bg-yellow-100 font-bold cursor-pointer"
                                                        >
                                                            +{days}일
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Link href={`/campaigns/${campaign.id}`} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-bold">상세보기</Link>
                                        </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            {criticalCampaigns.length === 0 && warningCampaigns.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">모든 캠페인이 정상 운영 중입니다!</h3>
                    <p className="text-gray-500">문제가 발생하면 자동으로 알려드립니다.</p>
                </div>
            )}

            {/* Bulk Extend Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl scale-in">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">일괄 기간 연장</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            선택한 <span className="text-primary font-bold">{selectedCampaigns.length}개 캠페인</span>의 모집 마감일을 연장하시겠습니까?
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <button disabled={isBulkExtending} onClick={() => handleBulkExtend(3)} className="px-4 py-4 bg-rose-50 border-2 border-rose-100 text-primary rounded-xl hover:bg-rose-100 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed">{isBulkExtending ? '처리중...' : '+3일'}</button>
                            <button disabled={isBulkExtending} onClick={() => handleBulkExtend(7)} className="px-4 py-4 bg-rose-50 border-2 border-rose-100 text-primary rounded-xl hover:bg-rose-100 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed">{isBulkExtending ? '처리중...' : '+7일'}</button>
                            <button disabled={isBulkExtending} onClick={() => handleBulkExtend(14)} className="px-4 py-4 bg-rose-50 border-2 border-rose-100 text-primary rounded-xl hover:bg-rose-100 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed">{isBulkExtending ? '처리중...' : '+14일'}</button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all font-bold">취소</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
