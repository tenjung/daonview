'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { AlertCircle, TrendingUp, Clock, CheckCircle, Calendar, Users } from 'lucide-react';

interface Campaign {
    id: number;
    title: string;
    platform: string;
    type: string;
    recruit_count: number;
    end_date: string;
    status: string;
    created_at: string;
    applications?: { count: number }[];
}

export default function AdvertiserDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    async function fetchCampaigns() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('campaigns')
                .select('*, applications(count)')
                .eq('created_by', user.id)
                .in('status', ['PENDING', 'RECRUITING', 'ONGOING'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('캠페인 로딩 오류:', error);
            toast.error('캠페인 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }

    // 캠페인 상태 분석
    function analyzeCampaign(campaign: Campaign) {
        const applicantCount = campaign.applications?.[0]?.count || 0;
        const targetCount = campaign.recruit_count;
        const applicationRate = (applicantCount / targetCount) * 100;

        const endDate = new Date(campaign.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'critical' | 'warning' | 'success' = 'success';
        let statusText = '';
        let actionText = '';

        if (daysLeft <= 0) {
            status = 'critical';
            statusText = '마감됨';
            actionText = '재모집';
        } else if (applicationRate < 30 && daysLeft <= 3) {
            status = 'critical';
            statusText = `🔴 모집 미달 (D-${daysLeft})`;
            actionText = '재모집/기간 연장';
        } else if (daysLeft <= 2) {
            status = 'warning';
            statusText = `🟡 마감 임박 (D-${daysLeft})`;
            actionText = '기간 연장하기';
        } else if (applicationRate >= 100) {
            status = 'success';
            statusText = '🟢 목표 달성';
            actionText = '리뷰어 선정';
        } else if (applicationRate >= 70) {
            status = 'success';
            statusText = '🟢 진행 순항';
            actionText = '리포트 보기';
        } else {
            status = 'warning';
            statusText = `🟡 신청 진행중 (${Math.round(applicationRate)}%)`;
            actionText = '공고 수정';
        }

        return {
            applicantCount,
            targetCount,
            applicationRate,
            daysLeft,
            status,
            statusText,
            actionText
        };
    }

    // 기간 연장 처리
    async function handleExtendDeadline(campaignId: number, days: number) {
        try {
            const campaign = campaigns.find(c => c.id === campaignId);
            if (!campaign) return;

            const currentEndDate = new Date(campaign.end_date);
            const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);

            const { error } = await supabase
                .from('campaigns')
                .update({ end_date: newEndDate.toISOString() })
                .eq('id', campaignId);

            if (error) throw error;

            toast.success(`모집 기간이 ${days}일 연장되었습니다!`);
            setShowExtendModal(false);
            fetchCampaigns();
        } catch (error) {
            console.error('기간 연장 오류:', error);
            toast.error('기간 연장 중 오류가 발생했습니다.');
        }
    }

    // 우선순위별로 캠페인 정렬
    const sortedCampaigns = [...campaigns].sort((a, b) => {
        const aAnalysis = analyzeCampaign(a);
        const bAnalysis = analyzeCampaign(b);

        const statusPriority = { critical: 0, warning: 1, success: 2 };
        return statusPriority[aAnalysis.status] - statusPriority[bAnalysis.status];
    });

    const criticalCampaigns = sortedCampaigns.filter(c => analyzeCampaign(c).status === 'critical');
    const warningCampaigns = sortedCampaigns.filter(c => analyzeCampaign(c).status === 'warning');

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-[260px] bg-white border-r border-border p-8 flex flex-col shrink-0">
                <div className="mb-8 pb-6 border-b border-border">
                    <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">ADVERTISER</div>
                    <div className="text-lg font-bold text-text-main">(주)다온컴퍼니</div>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer bg-rose-50 text-primary">대시보드</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">캠페인 관리</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">신청자 목록</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">리뷰어 선정</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium transition-all hover:bg-rose-50 hover:text-primary cursor-pointer">결제/포인트</div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-y-auto bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">캠페인 관리페이지</h1>
                        <p className="text-gray-500 mt-1">주의가 필요한 캠페인을 확인하고 즉시 조치하세요</p>
                    </div>
                    <Link href="/dashboard/campaign/new" className="btn btn-primary">+ 새 캠페인 등록</Link>
                </div>

                {/* Alert Banner */}
                {(criticalCampaigns.length > 0 || warningCampaigns.length > 0) && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                            <div>
                                <p className="font-bold text-orange-900">
                                    주의가 필요한 캠페인이 {criticalCampaigns.length + warningCampaigns.length}개 있습니다
                                </p>
                                <p className="text-sm text-orange-700">
                                    {criticalCampaigns.length > 0 && `긴급: ${criticalCampaigns.length}개`}
                                    {criticalCampaigns.length > 0 && warningCampaigns.length > 0 && ' | '}
                                    {warningCampaigns.length > 0 && `주의: ${warningCampaigns.length}개`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500">캠페인 로딩 중...</p>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                        <div className="text-6xl mb-4">📢</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">진행 중인 캠페인이 없습니다</h3>
                        <p className="text-gray-500 mb-6">첫 캠페인을 등록하고 리뷰어를 모집해보세요!</p>
                        <Link href="/dashboard/campaign/new" className="btn btn-primary">+ 캠페인 등록하기</Link>
                    </div>
                ) : (
                    <>
                        {/* Campaign Cards */}
                        <div className="space-y-4">
                            {sortedCampaigns.map((campaign) => {
                                const analysis = analyzeCampaign(campaign);
                                const progressColor = analysis.applicationRate < 30 ? 'bg-red-500' :
                                    analysis.applicationRate < 70 ? 'bg-yellow-500' : 'bg-green-500';

                                return (
                                    <div
                                        key={campaign.id}
                                        className={`bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg ${analysis.status === 'critical' ? 'border-red-300 shadow-md' :
                                                analysis.status === 'warning' ? 'border-yellow-300' :
                                                    'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: Campaign Info */}
                                            <div className="flex-1">
                                                {/* Status Badge */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${analysis.status === 'critical' ? 'bg-red-100 text-red-700' :
                                                            analysis.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-green-100 text-green-700'
                                                        }`}>
                                                        {analysis.statusText}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {campaign.platform} | {campaign.type}
                                                    </span>
                                                </div>

                                                {/* Campaign Title */}
                                                <h3 className="text-lg font-bold text-gray-900 mb-3">{campaign.title}</h3>

                                                {/* Progress Bar */}
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600">신청 현황</span>
                                                        <span className="font-bold">
                                                            {analysis.applicantCount} / {analysis.targetCount}명
                                                            <span className="text-gray-400 ml-2">({Math.round(analysis.applicationRate)}%)</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className={`h-full ${progressColor} transition-all duration-500`}
                                                            style={{ width: `${Math.min(analysis.applicationRate, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Warning Message */}
                                                {analysis.status === 'critical' && analysis.applicationRate < 30 && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                                        <p className="text-sm text-red-800">
                                                            ⚠️ {analysis.daysLeft > 0 ?
                                                                `${analysis.daysLeft}일 후 모집이 마감되지만 신청자가 부족합니다.` :
                                                                '모집이 마감되었지만 신청자가 부족합니다.'}
                                                        </p>
                                                    </div>
                                                )}

                                                {analysis.status === 'warning' && analysis.daysLeft <= 2 && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                                        <p className="text-sm text-yellow-800">
                                                            ⏰ 곧 모집이 마감됩니다. 현재 인원으로 선정하시겠습니까?
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex flex-col gap-2 min-w-[160px]">
                                                {analysis.status === 'critical' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCampaign(campaign);
                                                                setShowExtendModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                                                        >
                                                            재모집 / 기간 연장
                                                        </button>
                                                        <Link
                                                            href={`/dashboard/campaign/new?id=${campaign.id}`}
                                                            className="px-4 py-2 bg-white border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm text-center"
                                                        >
                                                            공고 수정
                                                        </Link>
                                                    </>
                                                )}

                                                {analysis.status === 'warning' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCampaign(campaign);
                                                                setShowExtendModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
                                                        >
                                                            기간 연장하기
                                                        </button>
                                                        <button className="px-4 py-2 bg-white border-2 border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors font-medium text-sm">
                                                            리뷰어 선정
                                                        </button>
                                                    </>
                                                )}

                                                {analysis.status === 'success' && (
                                                    <>
                                                        <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm">
                                                            리뷰어 선정하기
                                                        </button>
                                                        <button className="px-4 py-2 bg-white border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm">
                                                            리포트 보기
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Extend Deadline Modal */}
                {showExtendModal && selectedCampaign && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">모집 기간 연장</h3>
                            <p className="text-gray-600 mb-6">
                                <strong>{selectedCampaign.title}</strong>의 모집 기간을 연장하시겠습니까?
                            </p>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <button
                                    onClick={() => handleExtendDeadline(selectedCampaign.id, 3)}
                                    className="px-4 py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                    +3일
                                </button>
                                <button
                                    onClick={() => handleExtendDeadline(selectedCampaign.id, 7)}
                                    className="px-4 py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                    +7일
                                </button>
                                <button
                                    onClick={() => handleExtendDeadline(selectedCampaign.id, 14)}
                                    className="px-4 py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                    +14일
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExtendModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
