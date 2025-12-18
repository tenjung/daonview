'use client';

import { useState } from 'react';
import { Search, Filter, Star, ChevronRight, Instagram, MessageSquare } from 'lucide-react';

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

interface InfluencerListClientProps {
    initialInfluencers: InfluencerProfile[];
}

export default function InfluencerListClient({ initialInfluencers }: InfluencerListClientProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInfluencers = initialInfluencers.filter(inf =>
        inf.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
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
                        {filteredInfluencers.length === 0 ? (
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
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full"
                                                    style={{ width: `${inf.activity_stats?.total_selected ? Math.round((inf.activity_stats.total_completed / inf.activity_stats.total_selected) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">
                                                {inf.activity_stats?.total_selected ? Math.round((inf.activity_stats.total_completed / inf.activity_stats.total_selected) * 100) : 0}%
                                            </span>
                                        </div>
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
        </>
    );
}
