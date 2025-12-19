'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Calendar, Eye, Edit, Trash2, Clock, AlertCircle } from 'lucide-react';

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

interface AdvertiserCampaignTableProps {
    initialCampaigns: Campaign[];
}

export default function AdvertiserCampaignTable({ initialCampaigns }: AdvertiserCampaignTableProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    useEffect(() => {
        setCampaigns(initialCampaigns);
    }, [initialCampaigns]);

    // 캠페인 상태 분석 (D-Day, 모집율 등)
    function analyzeCampaign(campaign: Campaign) {
        const applicantCount = campaign.applications?.[0]?.count || 0;
        const targetCount = campaign.recruit_count;
        const applicationRate = (applicantCount / targetCount) * 100;

        const endDate = new Date(campaign.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'critical' | 'warning' | 'success' = 'success';
        let statusText = '';
        
        if (campaign.status === 'PENDING') {
            status = 'warning';
            statusText = '승인 대기';
        } else if (campaign.status === 'DRAFT') {
            status = 'warning';
            statusText = '임시저장';
        } else if (campaign.status === 'COMPLETED') {
            status = 'success';
            statusText = '완료됨';
        } else if (daysLeft <= 0) {
            status = 'critical';
            statusText = '마감됨';
        } else if (applicationRate < 30 && daysLeft <= 3) {
            status = 'critical';
            statusText = `모집 미달 D-${daysLeft}`;
        } else if (daysLeft <= 2) {
            status = 'warning';
            statusText = `마감 임박 D-${daysLeft}`;
        } else {
            status = 'success';
            statusText = '모집중';
        }

        return {
            applicantCount,
            targetCount,
            applicationRate,
            daysLeft,
            status,
            statusText
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
            
            // 로컬 상태 업데이트
            setCampaigns(prev => prev.map(c => 
                c.id === campaignId ? { ...c, end_date: newEndDate.toISOString() } : c
            ));
        } catch (error) {
            console.error('기간 연장 오류:', error);
            toast.error('기간 연장 중 오류가 발생했습니다.');
        }
    }

    if (campaigns.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-500 mb-6">해당하는 캠페인이 없습니다.</p>
                <Link href="/dashboard/campaign/new" className="btn btn-primary">+ 새 캠페인 등록</Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">상태</th>
                            <th className="px-6 py-4">캠페인 정보</th>
                            <th className="px-6 py-4">모집 현황</th>
                            <th className="px-6 py-4">마감일</th>
                            <th className="px-6 py-4 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {campaigns.map((campaign) => {
                            const analysis = analyzeCampaign(campaign);
                            
                            return (
                                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            analysis.status === 'critical' ? 'bg-red-100 text-red-700' :
                                            analysis.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {analysis.statusText}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 mb-1">{campaign.title}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{campaign.platform}</span>
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{campaign.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-gray-900">
                                                {analysis.applicantCount} / {analysis.targetCount}명
                                            </span>
                                            <span className="text-xs text-gray-400">({Math.round(analysis.applicationRate)}%)</span>
                                        </div>
                                        <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={`h-full ${
                                                    analysis.applicationRate < 30 ? 'bg-red-500' :
                                                    analysis.applicationRate < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(analysis.applicationRate, 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{new Date(campaign.end_date).toLocaleDateString()}</div>
                                        {analysis.daysLeft <= 3 && analysis.daysLeft > 0 && (
                                            <div className="text-xs text-red-500 font-bold mt-0.5">{analysis.daysLeft}일 남음</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            {(campaign.status === 'RECRUITING' || campaign.status === 'ONGOING') && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCampaign(campaign);
                                                        setShowExtendModal(true);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="기간 연장"
                                                >
                                                    <Clock size={18} />
                                                </button>
                                            )}
                                            <Link
                                                href={`/dashboard/campaign/new?id=${campaign.id}`}
                                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="수정"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <Link
                                                href={`/campaigns/${campaign.id}`}
                                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="상세보기"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

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
        </div>
    );
}
