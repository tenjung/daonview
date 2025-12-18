'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabaseClient';
import { Users, Search, Filter, Mail, Building2, CreditCard, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AdvertiserProfile {
    id: string;
    email: string;
    company_name: string;
    name: string;
    nickname: string;
    created_at: string;
    campaign_stats?: {
        total: number;
        recruiting: number;
        ongoing: number;
        completed: number;
    };
    payment_stats?: {
        total_count: number;
        total_amount: number;
    };
}

export default function AdminAdvertisersPage() {
    const [advertisers, setAdvertisers] = useState<AdvertiserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAdvertisers();
    }, []);

    async function fetchAdvertisers() {
        setLoading(true);
        try {
            // 1. 광고주 프로필 가져오기
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'ADVERTISER')
                .order('created_at', { ascending: false });

            if (profileError) throw profileError;

            // 2. 각 광고주별 캠페인 통계 및 결제 통계 가져오기 (실제 운영 시에는 개별 쿼리보다 RPC나 View가 효율적)
            const advertisersWithStats = await Promise.all((profiles || []).map(async (profile) => {
                // 캠페인 통계
                const { data: campaigns } = await supabase
                    .from('campaigns')
                    .select('status')
                    .eq('created_by', profile.id);

                const stats = {
                    total: campaigns?.length || 0,
                    recruiting: campaigns?.filter(c => c.status === 'RECRUITING').length || 0,
                    ongoing: campaigns?.filter(c => c.status === 'ONGOING').length || 0,
                    completed: campaigns?.filter(c => c.status === 'COMPLETED').length || 0,
                };

                // 결제 통계 (결제 테이블이 있다고 가정, 없으면 0으로 표시)
                // const { data: payments } = await supabase.from('payments').select('amount').eq('user_id', profile.id);
                const paymentStats = {
                    total_count: 0, // payments?.length || 0,
                    total_amount: 0, // payments?.reduce((sum, p) => sum + p.amount, 0) || 0
                };

                return {
                    ...profile,
                    campaign_stats: stats,
                    payment_stats: paymentStats
                };
            }));

            setAdvertisers(advertisersWithStats);
        } catch (error) {
            console.error('광고주 로딩 오류:', error);
            toast.error('광고주 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }

    const filteredAdvertisers = advertisers.filter(adv => 
        adv.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <main className="flex-1 p-10 overflow-y-auto bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">광고주 관리</h1>
                        <p className="text-gray-500 mt-1">등록된 광고주 계정과 캠페인 운영 현황을 관리합니다</p>
                    </div>
                </div>

                {/* 검색 및 필터 */}
                <div className="bg-white p-4 rounded-xl border border-border shadow-sm mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="기업명, 담당자명, 이메일로 검색"
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
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">기업 정보</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">진행중 캠페인</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">누적 캠페인</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">결제 현황</th>
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
                            ) : filteredAdvertisers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        검색 결과가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredAdvertisers.map((adv) => (
                                    <tr key={adv.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-blue-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{adv.company_name || '회사명 미등록'}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {adv.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">
                                                    모집 {adv.campaign_stats?.recruiting}
                                                </span>
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                                    진행 {adv.campaign_stats?.ongoing}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{adv.campaign_stats?.total}건</div>
                                            <div className="text-xs text-gray-400">완료 {adv.campaign_stats?.completed}건</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-gray-400" />
                                                <div className="text-sm font-medium text-gray-900">{adv.payment_stats?.total_count}회</div>
                                            </div>
                                            <div className="text-xs text-gray-400">{adv.payment_stats?.total_amount.toLocaleString()}원</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(adv.created_at).toLocaleDateString()}
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
