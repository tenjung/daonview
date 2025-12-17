'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, X, Eye } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminCampaignsPage() {
    const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingCampaigns = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending campaigns:', error);
            toast.error('캠페인 목록을 불러오지 못했습니다.');
        } else {
            setPendingCampaigns(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPendingCampaigns();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm('이 캠페인을 승인하시겠습니까? 승인 후 즉시 메인에 노출됩니다.')) return;

        const { error } = await supabase
            .from('campaigns')
            .update({ status: 'RECRUITING' })
            .eq('id', id);

        if (error) {
            toast.error('승인 처리 중 오류가 발생했습니다.');
            console.error(error);
        } else {
            toast.success('캠페인이 승인되었습니다.');
            fetchPendingCampaigns(); // Refresh list
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('이 캠페인을 거절하시겠습니까?')) return;

        // For now, let's just delete or set to REJECTED. Assuming REJECTED status exists or is safe to add. 
        // If not, maybe just DELETE? Let's use REJECTED to keep record.
        const { error } = await supabase
            .from('campaigns')
            .update({ status: 'REJECTED' })
            .eq('id', id);

        if (error) {
            toast.error('거절 처리 중 오류가 발생했습니다.');
            console.error(error);
        } else {
            toast.success('캠페인이 거절되었습니다.');
            fetchPendingCampaigns();
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">캠페인 승인/관리</h1>
                            <p className="text-gray-500 mt-1">승인 대기 중인 캠페인을 관리합니다</p>
                        </div>
                        <Link href="/dashboard/campaign/new" className="btn btn-primary">+ 캠페인 등록</Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                승인 대기 중인 캠페인
                                <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-xs">{pendingCampaigns.length}</span>
                            </h2>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-gray-500">로딩 중...</div>
                        ) : pendingCampaigns.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                <div className="text-4xl mb-4">✨</div>
                                <p>승인 대기 중인 캠페인이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-sm font-semibold border-y border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4">등록일</th>
                                            <th className="px-6 py-4">채널/유형</th>
                                            <th className="px-6 py-4">제목</th>
                                            <th className="px-6 py-4">광고주</th>
                                            <th className="px-6 py-4 text-center">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendingCampaigns.map((cam) => (
                                            <tr key={cam.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(cam.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{cam.platform}</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${cam.type === 'VISIT' ? 'bg-green-100 text-green-700' :
                                                            cam.type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>{cam.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 line-clamp-1">{cam.title}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{cam.category} | 모집 {cam.recruit_count}명</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {/* If we had advertiser JOIN, show name. For now assume ID or static */}
                                                    -
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(cam.id)}
                                                            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs"
                                                            title="승인"
                                                        >
                                                            <Check size={14} /> 승인
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(cam.id)}
                                                            className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium text-xs"
                                                            title="거절"
                                                        >
                                                            <X size={14} /> 거절
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
