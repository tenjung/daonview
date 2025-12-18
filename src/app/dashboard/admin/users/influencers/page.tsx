'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabaseClient';
import { Users, Search, Filter, Mail, Star, Award, CheckCircle2, ChevronRight, Instagram, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface InfluencerProfile {
    id: string;
    email: string;
    name: string;
    nickname: string;
    created_at: string;
    activity_stats?: {
        total_applied: number;
        total_selected: number;
        total_completed: number;
        selection_rate: number;
    };
}

export default function AdminInfluencersPage() {
    const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInfluencers();
    }, []);

    async function fetchInfluencers() {
        setLoading(true);
        try {
            // 1. 인플루언서 프로필 가져오기
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'INFLUENCER')
                .order('created_at', { ascending: false });

            if (profileError) throw profileError;

            // 2. 각 인플루언서별 활동 통계 가져오기
            const influencersWithStats = await Promise.all((profiles || []).map(async (profile) => {
                // 신청 통계
                const { data: applications } = await supabase
                    .from('applications')
                    .select('status')
                    .eq('user_id', profile.id);

                const total = applications?.length || 0;
                const selected = applications?.filter(a => ['SELECTED', 'COMPLETED'].includes(a.status)).length || 0;
                const completed = applications?.filter(a => a.status === 'COMPLETED').length || 0;

                return {
                    ...profile,
                    activity_stats: {
                        total_applied: total,
                        total_selected: selected,
                        total_completed: completed,
                        selection_rate: total > 0 ? Math.round((selected / total) * 100) : 0
                    }
                };
            }));

            setInfluencers(influencersWithStats);
        } catch (error) {
            console.error('인플루언서 로딩 오류:', error);
            toast.error('인플루언서 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }

    const filteredInfluencers = influencers.filter(inf => 
        inf.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <main className="flex-1 p-10 overflow-y-auto bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">인플루언서 관리</h1>
                        <p className="text-gray-500 mt-1">인플루언서 회원들의 활동 현황과 리뷰 이행률을 관리합니다</p>
                    </div>
                </div>

                {/* 검색 및 필터 */}
                <div className="bg-white p-4 rounded-xl border border-border shadow-sm mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="닉네임, 성함, 이메일로 검색"
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors">
                        <Filter className="w-4 h-4" />
                        필터
                    </button>
                </div>

                {/* 리스트 테이블 */}
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">인플루언서 정보</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">주요 채널</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">활동도 (신청/선정)</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">리뷰 이행률</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">가입일</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center">
                                        <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <p className="mt-2 text-sm text-gray-500">데이터 로딩 중...</p>
                                    </td>
                                </tr>
                            ) : filteredInfluencers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        검색 결과가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredInfluencers.map((inf) => (
                                    <tr key={inf.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                                                    <Star className="w-6 h-6 text-purple-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{inf.nickname || '닉네임 미등록'}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <span className="font-medium">{inf.name}</span> | {inf.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                                                    <Instagram className="w-4 h-4" />
                                                </div>
                                                <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                                                    <MessageSquare className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                신청 {inf.activity_stats?.total_applied} / 선정 {inf.activity_stats?.total_selected}
                                            </div>
                                            <div className="text-xs text-primary font-bold">선정률 {inf.activity_stats?.selection_rate}%</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2 w-20">
                                                    <div 
                                                        className="bg-green-500 h-2 rounded-full" 
                                                        style={{ width: `${inf.activity_stats?.total_selected ? Math.round((inf.activity_stats.total_completed / inf.activity_stats.total_selected) * 100) : 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {inf.activity_stats?.total_selected ? Math.round((inf.activity_stats.total_completed / inf.activity_stats.total_selected) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400">완료 {inf.activity_stats?.total_completed}건</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(inf.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
