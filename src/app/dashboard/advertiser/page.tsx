'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import AdvertiserSidebar from '@/components/AdvertiserSidebar';

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
            // toast.error('캠페인 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }

    // 간단한 상태 분석 (경고 개수 파악용)
    function analyzeCampaign(campaign: Campaign) {
        const applicantCount = campaign.applications?.[0]?.count || 0;
        const targetCount = campaign.recruit_count;
        const applicationRate = (applicantCount / targetCount) * 100;

        const endDate = new Date(campaign.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'critical' | 'warning' | 'success' = 'success';
        
        if (daysLeft <= 0) {
            status = 'critical';
        } else if (applicationRate < 30 && daysLeft <= 3) {
            status = 'critical';
        } else if (daysLeft <= 2) {
            status = 'warning';
        }

        return status;
    }

    const criticalCampaigns = campaigns.filter(c => analyzeCampaign(c) === 'critical');
    const warningCampaigns = campaigns.filter(c => analyzeCampaign(c) === 'warning');

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdvertiserSidebar />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">광고주 대시보드</h1>
                            <p className="text-gray-500 mt-1">캠페인 현황을 한눈에 확인하세요.</p>
                        </div>
                        <Link href="/dashboard/campaign/new" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">+ 캠페인 신규 등록</Link>
                    </div>

                    {/* Alert Banner */}
                    {(criticalCampaigns.length > 0 || warningCampaigns.length > 0) && (
                        <div className="bg-white border-l-4 border-orange-500 p-6 rounded-lg shadow-sm mb-8 animate-pulse-subtle">
                            <div className="flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-orange-600 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                                        주의가 필요한 캠페인이 {criticalCampaigns.length + warningCampaigns.length}개 있습니다
                                    </h3>
                                    <p className="text-gray-600 mb-3">
                                        모집 마감이 임박했거나 신청자가 부족한 캠페인을 확인해주세요.
                                    </p>
                                    <Link 
                                        href="/dashboard/advertiser/campaigns?status=RECRUITING" 
                                        className="text-orange-600 font-bold hover:underline text-sm"
                                    >
                                        → 조치하러 가기
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm text-gray-500 font-medium mb-2">진행 중인 캠페인</div>
                            <div className="text-4xl font-bold text-gray-900">{campaigns.length}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm text-gray-500 font-medium mb-2">총 신청자 수</div>
                            <div className="text-4xl font-bold text-blue-600">
                                {campaigns.reduce((acc, curr) => acc + (curr.applications?.[0]?.count || 0), 0)}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm text-gray-500 font-medium mb-2">포인트 잔액</div>
                            <div className="text-4xl font-bold text-gray-900">0 P</div>
                        </div>
                    </div>

                    {/* Empty State / Welcome */}
                    {campaigns.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-6xl mb-4">👋</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">환영합니다!</h3>
                            <p className="text-gray-500 mb-6">아직 진행 중인 캠페인이 없습니다. 첫 캠페인을 등록해보세요.</p>
                            <Link href="/dashboard/campaign/new" className="btn btn-primary">+ 캠페인 등록하기</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
