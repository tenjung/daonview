'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import AdvertiserSidebar from '@/components/AdvertiserSidebar';
import { toast } from 'sonner';

interface Applicant {
    id: number;
    created_at: string;
    status: string;
    message: string;
    campaign: {
        id: number;
        title: string;
    };
    user: {
        id: string;
        nickname: string;
        blog_url?: string;
        instagram_url?: string;
        avatar_url?: string;
    };
}

export default function AdvertiserApplicantsPage() {
    const { user, isLoading } = useAuthStore();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && user) {
            fetchApplicants();
        } else if (!isLoading && !user) {
            setLoading(false);
        }
    }, [isLoading, user]);

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

            // 2. 해당 캠페인들에 지원한 지원자 조회
            const { data, error } = await supabase
                .from('applications')
                .select(`
                    id,
                    created_at,
                    status,
                    message,
                    campaign:campaign_id (id, title),
                    user:user_id (id, nickname, blog_url, instagram_url, avatar_url)
                `)
                .in('campaign_id', campaignIds)
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

    const handleStatusChange = async (applicationId: number, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('applications')
                .update({ status: newStatus })
                .eq('id', applicationId);

            if (error) throw error;

            toast.success(newStatus === 'SELECTED' ? '리뷰어를 선정했습니다!' : '신청을 거절했습니다.');

            // 목록 갱신** (Optimistic Update)
            setApplicants(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status: newStatus } : app
            ));

        } catch (error) {
            console.error('Status update error:', error);
            toast.error('상태 변경 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdvertiserSidebar />
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
                            {applicants.map((app) => (
                                <div key={app.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                                            {app.user.avatar_url ? <img src={app.user.avatar_url} className="w-full h-full rounded-full object-cover" /> : '👤'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-lg">{app.user.nickname}</span>{/* deploy trigger */}
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {app.campaign.title}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 mb-2">{app.message || '지원 메시지가 없습니다.'}</div>
                                            <div className="flex gap-2 text-xs text-blue-600">
                                                {app.user.blog_url && <a href={app.user.blog_url} target="_blank" className="hover:underline">블로그 보기</a>}
                                                {app.user.instagram_url && <a href={app.user.instagram_url} target="_blank" className="hover:underline">인스타그램 보기</a>}
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
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${app.status === 'SELECTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {app.status === 'SELECTED' ? '선정됨' : '거절됨'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
