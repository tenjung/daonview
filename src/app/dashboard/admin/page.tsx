'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, Clock, Shield, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
    id: string;
    email: string;
    name?: string;
    nickname?: string;
    company_name?: string;
    role: string;
}

interface CampaignWithApplications {
    id: number;
    title: string;
    platform: string;
    type: string;
    recruit_count: number;
    end_date: string;
    status: string;
    created_at: string;
    created_by: string;
    applications?: { count: number }[];
    profiles?: Profile;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalAdvertisers: 0,
        totalInfluencers: 0,
        todayCampaigns: 0,
        pendingApprovals: 0,
    });
    const [campaigns, setCampaigns] = useState<CampaignWithApplications[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        fetchDashboardStats();
        fetchCampaigns();
    }, []);

    async function fetchDashboardStats() {
        try {
            // 광고주 수
            const { count: advertiserCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'ADVERTISER');

            // 인플루언서 수
            const { count: influencerCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'INFLUENCER');

            // 오늘 생성된 캠페인 수
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayCount } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // 승인 대기 중인 캠페인 수
            const { count: pendingCount } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');

            setStats({
                totalAdvertisers: advertiserCount || 0,
                totalInfluencers: influencerCount || 0,
                todayCampaigns: todayCount || 0,
                pendingApprovals: pendingCount || 0,
            });
        } catch (error) {
            console.error('대시보드 통계 로딩 오류:', error);
        }
    }

    async function fetchCampaigns() {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
                    *,
                    applications(count),
                    profiles:created_by(id, email, name, company_name, role)
                `)
                .in('status', ['RECRUITING', 'ONGOING'])
                .order('end_date', { ascending: true });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('캠페인 로딩 오류:', error);
        } finally {
            setLoading(false);
        }
    }

    // 캠페인 위험도 분석
    function analyzeCampaignRisk(campaign: CampaignWithApplications) {
        const applicantCount = campaign.applications?.[0]?.count || 0;
        const targetCount = campaign.recruit_count;
        const applicationRate = (applicantCount / targetCount) * 100;

        const endDate = new Date(campaign.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let riskLevel: 'critical' | 'warning' | 'normal' = 'normal';

        // 긴급: 마감 3일 이내 + 신청률 50% 미만
        if (daysLeft <= 3 && applicationRate < 50) {
            riskLevel = 'critical';
        }
        // 주의: 마감 3일 이내 또는 신청률 50% 미만
        else if (daysLeft <= 3 || applicationRate < 50) {
            riskLevel = 'warning';
        }

        return {
            applicantCount,
            targetCount,
            applicationRate,
            daysLeft,
            riskLevel
        };
    }

    // 위험 캠페인 필터링
    const criticalCampaigns = campaigns.filter(c => analyzeCampaignRisk(c).riskLevel === 'critical');
    const warningCampaigns = campaigns.filter(c => analyzeCampaignRisk(c).riskLevel === 'warning');

    // 일괄 기간 연장
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
            fetchCampaigns();
        } catch (error) {
            console.error('일괄 연장 오류:', error);
            toast.error('일괄 연장 중 오류가 발생했습니다.');
        }
    }

    // 체크박스 토글
    function toggleCampaignSelection(campaignId: number) {
        setSelectedCampaigns(prev =>
            prev.includes(campaignId)
                ? prev.filter(id => id !== campaignId)
                : [...prev, campaignId]
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <main className="flex-1 p-10 overflow-y-auto bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">슈퍼 어드민 관제탑</h1>
                        <p className="text-gray-500 mt-1">문제가 있는 캠페인만 빨간불로 표시됩니다</p>
                    </div>
                    <Link href="/dashboard/campaign/new" className="btn btn-primary text-sm">+ 캠페인 강제 등록</Link>
                </div>

                {/* Section A: 최상단 현황판 (Global KPI) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* 기업 회원 수 */}
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">총 회원수 (기업)</div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <span className="text-xl">🏢</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                            {stats.totalAdvertisers.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">광고주 계정</div>
                    </div>

                    {/* 인플루언서 회원 수 */}
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">총 회원수 (인플)</div>
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                                <span className="text-xl">⭐</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-purple-600">
                            {stats.totalInfluencers.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">인플루언서 계정</div>
                    </div>

                    {/* 오늘 신규 캠페인 */}
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">오늘 신규 캠페인</div>
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                <span className="text-xl">📢</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-green-600">{stats.todayCampaigns}</div>
                        <div className="text-xs text-gray-400 mt-1">오늘 등록된 캠페인</div>
                    </div>

                    {/* 승인 대기 */}
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">대기중인 승인 요청</div>
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                                <span className="text-xl">⏰</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</div>
                        <div className="text-xs text-gray-400 mt-1">승인 대기 중</div>
                    </div>
                </div>

                {/* 위험 신호등 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div
                        className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => document.getElementById('critical-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <h3 className="font-bold text-red-900">🔴 위험 (모집 미달 D-3)</h3>
                        </div>
                        <div className="text-4xl font-bold text-red-600">{criticalCampaigns.length}건</div>
                        <p className="text-sm text-red-700 mt-2">즉시 조치 필요</p>
                    </div>

                    <div
                        className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => document.getElementById('warning-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-6 h-6 text-yellow-600" />
                            <h3 className="font-bold text-yellow-900">🟡 주의 (마감 임박)</h3>
                        </div>
                        <div className="text-4xl font-bold text-yellow-600">{warningCampaigns.length}건</div>
                        <p className="text-sm text-yellow-700 mt-2">모니터링 필요</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-6 h-6 text-purple-600" />
                            <h3 className="font-bold text-purple-900">⚖️ 법적 대응</h3>
                        </div>
                        <div className="text-4xl font-bold text-purple-600">0건</div>
                        <p className="text-sm text-purple-700 mt-2">먹튀/미제출</p>
                    </div>
                </div>

                {/* Section B: 긴급 조치 리스트 */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500">캠페인 분석 중...</p>
                    </div>
                ) : (
                    <>
                        {/* 🔴 긴급: 모집 미달 구조대 */}
                        {criticalCampaigns.length > 0 && (
                            <div id="critical-section" className="mb-8">
                                <div className="bg-white rounded-xl border-2 border-red-300 overflow-hidden">
                                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 border-b-2 border-red-200">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
                                                    <AlertTriangle className="w-6 h-6" />
                                                    🔴 모집 미달 구조대
                                                </h2>
                                                <p className="text-red-700 mt-1">마감 3일 이내 + 신청률 50% 미만 - 즉시 조치 필요</p>
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
                                                    <th className="px-4 py-3 text-left">
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
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">플랫폼</th>
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
                                                                    {isAdmin && (
                                                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold w-fit">
                                                                            관리자 등록
                                                                        </span>
                                                                    )}
                                                                    {!isAdmin && (
                                                                        <span className="text-xs text-gray-500">광고주</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">{campaign.platform}</span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1">
                                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                                            <div
                                                                                className="bg-red-500 h-2 rounded-full"
                                                                                style={{ width: `${Math.min(analysis.applicationRate, 100)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                                                                        {analysis.applicantCount}/{analysis.targetCount}명
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-red-600 mt-1 font-medium">
                                                                    {Math.round(analysis.applicationRate)}% 달성
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="text-sm font-bold text-red-600">D-{analysis.daysLeft}</div>
                                                                <div className="text-xs text-gray-500">{new Date(campaign.end_date).toLocaleDateString()}</div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex gap-2 justify-center">
                                                                    <Link
                                                                        href={`/dashboard/campaign/new?id=${campaign.id}`}
                                                                        className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-xs font-medium"
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
                                </div>
                            </div>
                        )}

                        {/* 🟡 주의: 마감 임박 */}
                        {warningCampaigns.length > 0 && (
                            <div id="warning-section" className="mb-8">
                                <div className="bg-white rounded-xl border-2 border-yellow-300 overflow-hidden">
                                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b-2 border-yellow-200">
                                        <h2 className="text-2xl font-bold text-yellow-900 flex items-center gap-2">
                                            <Clock className="w-6 h-6" />
                                            🟡 주의: 마감 임박 / 신청률 저조
                                        </h2>
                                        <p className="text-yellow-700 mt-1">모니터링이 필요한 캠페인</p>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid gap-4">
                                            {warningCampaigns.map((campaign) => {
                                                const analysis = analyzeCampaignRisk(campaign);
                                                const advertiser = campaign.profiles;
                                                const advertiserName = advertiser?.company_name || advertiser?.nickname || advertiser?.email || '알 수 없음';
                                                const isAdmin = advertiser?.role?.toUpperCase() === 'ADMIN';

                                                return (
                                                    <div key={campaign.id} className="border border-yellow-200 rounded-lg p-4 hover:bg-yellow-50 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="font-bold text-gray-900">{campaign.title}</h3>
                                                                    {isAdmin && (
                                                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold">
                                                                            관리자
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-600 mb-2">
                                                                    광고주: <span className="font-medium">{advertiserName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-2">
                                                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">{campaign.platform}</span>
                                                                    <span className="text-sm text-gray-600">
                                                                        {analysis.applicantCount}/{analysis.targetCount}명 ({Math.round(analysis.applicationRate)}%)
                                                                    </span>
                                                                    <span className="text-sm font-medium text-yellow-600">D-{analysis.daysLeft}</span>
                                                                </div>
                                                            </div>
                                                            <Link
                                                                href={`/campaigns/${campaign.id}`}
                                                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm font-medium"
                                                            >
                                                                상세보기
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 정상 운영 중 메시지 */}
                        {criticalCampaigns.length === 0 && warningCampaigns.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">모든 캠페인이 정상 운영 중입니다!</h3>
                                <p className="text-gray-500">문제가 발생하면 자동으로 알려드립니다.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Bulk Extend Modal */}
                {showBulkModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">일괄 기간 연장</h3>
                            <p className="text-gray-600 mb-6">
                                선택한 <strong>{selectedCampaigns.length}개 캠페인</strong>의 모집 기간을 연장하시겠습니까?
                            </p>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <button
                                    onClick={() => handleBulkExtend(3)}
                                    className="px-4 py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                    +3일
                                </button>
                                <button
                                    onClick={() => handleBulkExtend(7)}
                                    className="px-4 py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                    +7일
                                </button>
                                <button
                                    onClick={() => handleBulkExtend(14)}
                                    className="px-4 py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                    +14일
                                </button>
                            </div>

                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
