'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

interface AdminDashboardClientProps {
    initialCampaigns: any[];
}

export default function AdminDashboardClient({ initialCampaigns }: AdminDashboardClientProps) {
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
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
    function analyzeCampaignRisk(campaign: any) {
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

    async function handleBulkExtend(days: number) {
        try {
            for (const campaignId of selectedCampaigns) {
                const campaign = campaigns.find(c => c.id === campaignId);
                if (!campaign) continue;

                const currentEndDate = new Date(campaign.end_date);
                const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);

                await supabase
                    .from('campaigns')
                    .update({ end_date: newEndDate.toISOString() })
                    .eq('id', campaignId);
            }

            toast.success(`${selectedCampaigns.length}개 캠페인의 기간이 ${days}일 연장되었습니다!`);
            setSelectedCampaigns([]);
            setShowBulkModal(false);

            // Re-fetch or update local state
            const { data } = await supabase.from('campaigns').select('*, applications(count), profiles:created_by(*)').in('status', ['RECRUITING', 'ONGOING']);
            if (data) setCampaigns(data);

        } catch (error) {
            console.error('일괄 연장 오류:', error);
            toast.error('일괄 연장 중 오류가 발생했습니다.');
        }
    }

    function toggleCampaignSelection(campaignId: number) {
        setSelectedCampaigns(prev =>
            prev.includes(campaignId)
                ? prev.filter(id => id !== campaignId)
                : [...prev, campaignId]
        );
    }

    return (
        <>
            {/* 위험 신호등 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div
                    className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => document.getElementById('critical-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className="font-bold text-red-900 text-sm">🔴 위험 (모집 미달 D-3)</h3>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{criticalCampaigns.length}건</div>
                    <p className="text-[10px] text-red-700 mt-1">즉시 조치 필요</p>
                </div>

                <div
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => document.getElementById('warning-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-bold text-yellow-900 text-sm">🟡 주의 (마감 임박)</h3>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{warningCampaigns.length}건</div>
                    <p className="text-[10px] text-yellow-700 mt-1">모니터링 필요</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">⚖️</span>
                        <h3 className="font-bold text-purple-900 text-sm">법적 대응</h3>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">0건</div>
                    <p className="text-[10px] text-purple-700 mt-1">먹튀/미제출</p>
                </div>
            </div>

            {/* 🔴 긴급: 모집 미달 구조대 */}
            {criticalCampaigns.length > 0 && (
                <div id="critical-section" className="mb-8">
                    <div className="bg-white rounded-xl border-2 border-red-300 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 border-b-2 border-red-200">
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
                                        onClick={() => setShowBulkModal(true)}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold shadow-lg"
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
                                                    <Link
                                                        href={`/dashboard/campaign/new?id=${campaign.id}`}
                                                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs font-bold"
                                                    >
                                                        공고 수정
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 🟡 주의: 마감 임박 */}
            {warningCampaigns.length > 0 && (
                <div id="warning-section" className="mb-8">
                    <div className="bg-white rounded-xl border-2 border-yellow-300 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 border-b-2 border-yellow-200">
                            <h2 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                🟡 주의: 마감 임박 / 신청률 저조
                            </h2>
                        </div>
                        <div className="p-4 grid gap-3">
                            {warningCampaigns.map((campaign) => {
                                const analysis = analyzeCampaignRisk(campaign);
                                return (
                                    <div key={campaign.id} className="border border-yellow-200 rounded-lg p-3 hover:bg-yellow-50 transition-colors flex justify-between items-center">
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
                                        <Link href={`/campaigns/${campaign.id}`} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-bold">상세보기</Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
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
                            <button onClick={() => handleBulkExtend(3)} className="px-4 py-4 bg-rose-50 border-2 border-rose-100 text-primary rounded-xl hover:bg-rose-100 transition-all font-bold">+3일</button>
                            <button onClick={() => handleBulkExtend(7)} className="px-4 py-4 bg-rose-50 border-2 border-rose-100 text-primary rounded-xl hover:bg-rose-100 transition-all font-bold">+7일</button>
                            <button onClick={() => handleBulkExtend(14)} className="px-4 py-4 bg-rose-50 border-2 border-rose-100 text-primary rounded-xl hover:bg-rose-100 transition-all font-bold">+14일</button>
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
