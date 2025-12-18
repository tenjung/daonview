'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Eye, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import ConfirmDialog from '@/components/ConfirmDialog';

function AdminCampaignsContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'active';
    
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Confirm Dialog State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'info' | 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'info'
    });

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('campaigns')
                .select('*, applications(count)')
                .order('created_at', { ascending: false });

            // Apply filters based on type
            if (type === 'pending') {
                query = query.eq('status', 'PENDING');
            } else if (type === 'active') {
                query = query.in('status', ['RECRUITING', 'ONGOING']);
            } else if (type === 'completed') {
                query = query.eq('status', 'COMPLETED');
            } else if (type === 'upcoming') {
                query = query.eq('status', 'RECRUITING'); // Assuming upcoming are also 'RECRUITING' but with future date
            }

            const { data, error } = await query;

            if (error) throw error;

            let filteredData = data || [];

            // Client-side filtering for dates if needed
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (type === 'active') {
                // Filter out those that haven't started yet if we have start date info
                filteredData = filteredData.filter(cam => {
                    const options = Array.isArray(cam.campaign_options) ? cam.campaign_options[0] : cam.campaign_options;
                    const startDateStr = options?.step1Data?.recruitmentStartDate;
                    if (startDateStr) {
                        const startDate = new Date(startDateStr);
                        return startDate <= now;
                    }
                    return true;
                });
            } else if (type === 'upcoming') {
                // Filter ONLY those that have a future start date
                filteredData = filteredData.filter(cam => {
                    const options = Array.isArray(cam.campaign_options) ? cam.campaign_options[0] : cam.campaign_options;
                    const startDateStr = options?.step1Data?.recruitmentStartDate;
                    if (startDateStr) {
                        const startDate = new Date(startDateStr);
                        return startDate > now;
                    }
                    return false;
                });
            }

            setCampaigns(filteredData);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('캠페인 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [type]);

    const handleApprove = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: '캠페인 승인',
            message: '이 캠페인을 승인하시겠습니까?\n승인 후 날짜에 맞춰 메인에 노출됩니다.',
            type: 'info',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('campaigns')
                    .update({ status: 'RECRUITING' })
                    .eq('id', id);

                if (error) {
                    toast.error('승인 처리 중 오류가 발생했습니다.');
                    console.error(error);
                } else {
                    toast.success('캠페인이 승인되었습니다.');
                    fetchCampaigns();
                }
            }
        });
    };

    const handleReject = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: '캠페인 거절',
            message: '이 캠페인을 거절하시겠습니까?\n거절된 캠페인은 승인 대기 목록에서 제외됩니다.',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('campaigns')
                    .update({ status: 'REJECTED' })
                    .eq('id', id);

                if (error) {
                    toast.error('거절 처리 중 오류가 발생했습니다.');
                    console.error(error);
                } else {
                    toast.success('캠페인이 거절되었습니다.');
                    fetchCampaigns();
                }
            }
        });
    };

    const getPageTitle = () => {
        switch (type) {
            case 'pending': return '요청중인 캠페인';
            case 'active': return '진행 중인 캠페인';
            case 'completed': return '완료된 캠페인';
            case 'upcoming': return '진행 예정 캠페인';
            default: return '캠페인 관리';
        }
    };

    const getEmptyMessage = () => {
        switch (type) {
            case 'pending': return '승인 대기 중인 캠페인이 없습니다.';
            case 'active': return '진행 중인 캠페인이 없습니다.';
            case 'completed': return '완료된 캠페인이 없습니다.';
            case 'upcoming': return '진행 예정인 캠페인이 없습니다.';
            default: return '목록이 비어있습니다.';
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                            <p className="text-gray-500 mt-1">
                                {type === 'pending' ? '새로 등록된 캠페인을 검토하고 승인하세요.' : 
                                 type === 'active' ? '현재 실시간으로 모집 및 진행 중인 캠페인입니다.' :
                                 type === 'upcoming' ? '승인 완료되었으나 시작일이 남은 캠페인입니다.' :
                                 '종료된 캠페인 내역을 확인합니다.'}
                            </p>
                        </div>
                        <Link href="/dashboard/campaign/new" className="btn btn-primary">+ 캠페인 등록</Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {getPageTitle()} 목록
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    type === 'pending' ? 'bg-rose-100 text-rose-600' :
                                    type === 'active' ? 'bg-green-100 text-green-600' :
                                    type === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {campaigns.length}
                                </span>
                            </h2>
                        </div>

                        {loading ? (
                            <div className="p-20 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-20 text-center text-gray-400 flex flex-col items-center">
                                <div className="text-5xl mb-4">
                                    {type === 'pending' ? '✨' : type === 'active' ? '📢' : type === 'upcoming' ? '⏳' : '✅'}
                                </div>
                                <p className="text-lg font-medium">{getEmptyMessage()}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-y border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4">등록/시작일</th>
                                            <th className="px-6 py-4">유형</th>
                                            <th className="px-6 py-4">캠페인 정보</th>
                                            <th className="px-6 py-4">모집 현황</th>
                                            <th className="px-6 py-4 text-center">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {campaigns.map((cam) => {
                                            const options = Array.isArray(cam.campaign_options) ? cam.campaign_options[0] : cam.campaign_options;
                                            const startDate = options?.step1Data?.recruitmentStartDate || cam.created_at;
                                            
                                            return (
                                                <tr key={cam.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">{new Date(cam.created_at).toLocaleDateString()}</div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                            <Calendar size={12} /> {new Date(startDate).toLocaleDateString()} 시작
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            {/* 플랫폼 뱃지 */}
                                                            {(() => {
                                                                const p = cam.platform;
                                                                const isPurchase = p === '기타' || p === 'OTHER' || p === '구매평' || p === 'PURCHASE';
                                                                const isBlog = p === '블로그' || p === 'BLOG';
                                                                const isInsta = p === '인스타' || p === 'INSTAGRAM';
                                                                
                                                                let label = p;
                                                                if (isPurchase) label = '구매평';
                                                                else if (isBlog) label = '블로그';
                                                                else if (isInsta) label = '인스타';

                                                                return (
                                                                    <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                        isPurchase ? 'bg-orange-500 text-white' : 
                                                                        isBlog ? 'bg-green-600 text-white' : 
                                                                        isInsta ? 'bg-pink-500 text-white' : 'bg-slate-800 text-white'
                                                                    }`}>
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}

                                                            {/* 유형 뱃지 */}
                                                            {(() => {
                                                                const t = cam.type;
                                                                const isVisit = t === '방문형' || t === 'VISIT';
                                                                const isDelivery = t === '배송형' || t === 'DELIVERY';
                                                                
                                                                let label = t;
                                                                if (isVisit) label = '방문';
                                                                else if (isDelivery) label = '배송';
                                                                else label = '기자단';

                                                                return (
                                                                    <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                                        isVisit ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                        isDelivery ? 'bg-green-50 text-green-600 border-green-100' : 
                                                                        'bg-purple-50 text-purple-600 border-purple-100'
                                                                    }`}>
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900 line-clamp-1">{cam.title}</div>
                                                        <div className="text-xs text-gray-500 mt-1 italic">{cam.category || '카테고리 없음'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {(() => {
                                                                const applicants = Array.isArray(cam.applications) 
                                                                    ? cam.applications[0]?.count 
                                                                    : (cam.applications as any)?.count || 0;
                                                                return <span className="text-sm font-bold text-primary">{applicants}</span>;
                                                            })()}
                                                            <span className="text-gray-300">/</span>
                                                            <span className="text-sm text-gray-600">{cam.recruit_count}명</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1">
                                                            ~ {new Date(cam.end_date).toLocaleDateString()} 마감
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2">
                                                            {type === 'pending' ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApprove(cam.id)}
                                                                        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-bold text-xs shadow-sm"
                                                                    >
                                                                        <Check size={14} /> 승인
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(cam.id)}
                                                                        className="flex items-center gap-1 bg-white text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-medium text-xs"
                                                                    >
                                                                        <X size={14} /> 거절
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <Link
                                                                    href={`/campaigns/${cam.id}`}
                                                                    className="flex items-center gap-1 bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs"
                                                                >
                                                                    <Eye size={14} /> 상세보기
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.title.includes('승인') ? '승인하기' : '거절하기'}
            />
        </div>
    );
}

export default function AdminCampaignsPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">관리자 페이지 구성 중...</p>
                </div>
            </div>
        }>
            <AdminCampaignsContent />
        </Suspense>
    );
}
