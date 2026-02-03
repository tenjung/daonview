'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Megaphone, Plus, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { AdvertiserStatsCards } from '@/components/advertiser/AdvertiserStatsCards';
import { CampaignDataTable } from '@/components/admin/CampaignDataTable';
import { Campaign } from '@/types/database';
import { ADVERTISER_LINKS } from '@/constants/navigation';

export default function AdvertiserDashboard() {
    const { user, profile, isLoading } = useAuthStore();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && user) {
            fetchCampaigns();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [isLoading, user]);

    async function fetchCampaigns() {
        if (!user) return;

        try {
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
        } finally {
            setLoading(false);
        }
    }

    // 마감 임박/모집 미달 캠페인 자동 알림 (지능형 모니터링)
    useEffect(() => {
        if (campaigns.length > 0 && user) {
            const checkAndNotify = async () => {
                for (const campaign of campaigns) {
                    const status = analyzeCampaign(campaign);
                    if (status !== 'success') {
                        const type = status === 'critical' ? 'CAMPAIGN_CRITICAL' : 'CAMPAIGN_WARNING';
                        const title = status === 'critical' ? '🚨 캠페인 긴급 조치 필요' : '⚠️ 캠페인 모니터링 알림';

                        // 최근 3일 내 동일 캠페인/타입 알림이 있는지 확인
                        const { count } = await supabase
                            .from('notifications')
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', user.id)
                            .eq('type', type)
                            .ilike('content', `%[${campaign.title}]%`)
                            .gt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

                        if (count === 0) {
                            await supabase.from('notifications').insert({
                                user_id: user.id,
                                type,
                                title,
                                content: `[${campaign.title}] 캠페인의 마감이 임박했거나 모집이 저조합니다. 확인 후 기간 연장 등의 조치를 고려해 주세요.`,
                                link: `/dashboard/advertiser/campaigns?id=${campaign.id}`
                            });
                        }
                    }
                }
            };
            checkAndNotify();
        }
    }, [campaigns, user]);

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

    const statsData = {
        activeCampaigns: campaigns.length,
        totalApplications: campaigns.reduce((acc, curr) => acc + (curr.applications?.[0]?.count || 0), 0),
        pointBalance: 0
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="ADVERTISER"
                userName={profile?.company_name || profile?.nickname || '광고주'}
                links={ADVERTISER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/advertiser'
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4 tracking-tight italic">
                                <LayoutDashboard className="w-10 h-10 text-primary" />
                                Advertiser
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">캠페인 효율과 브랜드 성과를 실시간으로 확인하세요.</p>
                        </div>
                        <Link
                            href="/dashboard/campaign/new"
                            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-1 active:translate-y-0"
                        >
                            <Plus size={20} /> 새 캠페인 등록
                        </Link>
                    </div>

                    {/* Business Verification Banner */}
                    {profile?.biz_verification_status !== 'APPROVED' && (
                        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-8 rounded-[32px] shadow-2xl mb-10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ShieldCheck size={140} className="text-white" />
                            </div>
                            <div className="flex items-start gap-8 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-primary shrink-0 backdrop-blur-xl border border-white/20">
                                    <ShieldCheck size={32} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-black text-2xl tracking-tight">비즈니스 인증이 필요합니다</h3>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${profile?.biz_verification_status === 'PENDING' ? 'bg-amber-500 text-white' :
                                            profile?.biz_verification_status === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'
                                            }`}>
                                            {profile?.biz_verification_status === 'PENDING' ? '심사 대기 중' :
                                                profile?.biz_verification_status === 'REJECTED' ? '반려됨' : '미인증'}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl font-medium">
                                        캠페인을 등록하고 인플루언서를 모집하려면 사업자 인증이 필수입니다. <br />
                                        사업자 등록증을 제출하시면 AI 분석을 통해 정보 일치 시 <strong>즉시 승인</strong>됩니다.
                                    </p>
                                    <Link
                                        href="/dashboard/advertiser/verification"
                                        className="inline-flex items-center gap-3 bg-primary text-white px-8 py-3.5 rounded-2xl font-black hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all text-sm group/btn"
                                    >
                                        {profile?.biz_verification_status === 'PENDING' ? '인증 진행 현황 보기' : '지금 인증 요청하기'}
                                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alert Banner */}
                    {(criticalCampaigns.length > 0 || warningCampaigns.length > 0) && (
                        <div className="bg-white border border-rose-100 p-8 rounded-3xl shadow-sm mb-10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <AlertCircle size={120} className="text-primary" />
                            </div>
                            <div className="flex items-start gap-6 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-primary shrink-0 animate-bounce-subtle">
                                    <AlertCircle size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-xl text-gray-900 mb-2">
                                        주의가 필요한 캠페인이 {criticalCampaigns.length + warningCampaigns.length}개 발견되었습니다
                                    </h3>
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        모집 마감이 임박했거나 신청자가 부족한 캠페인이 감지되었습니다. <br />
                                        리뷰어의 관심을 끌 수 있도록 공고를 수정하거나 모집 기간을 연장하는 것을 권장합니다.
                                    </p>
                                    <Link
                                        href="/dashboard/advertiser/campaigns"
                                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition-all text-sm"
                                    >
                                        캠페인 관리로 이동 <Megaphone size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <AdvertiserStatsCards stats={statsData} />

                    {/* Recent Campaigns Table */}
                    <div className="mt-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Campaigns</h2>
                            <Link
                                href="/dashboard/advertiser/campaigns"
                                className="text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm"
                            >
                                View All →
                            </Link>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <CampaignDataTable
                                data={campaigns}
                                isLoading={loading}
                                isAdmin={false}
                            />
                        </div>
                    </div>

                    {/* Empty State / Welcome */}
                    {campaigns.length === 0 && !loading && (
                        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                🚀
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">다온뷰에 오신 것을 환영합니다!</h3>
                            <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
                                아직 등록된 캠페인이 없네요. <br />
                                지금 바로 첫 번째 캠페인을 등록하고 최고의 인플루언서들을 만나보세요.
                            </p>
                            <Link
                                href="/dashboard/campaign/new"
                                className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
                            >
                                <Plus size={24} /> 첫 캠페인 등록하기
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
