'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Check, X, Edit, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

interface CampaignTableClientProps {
    initialCampaigns: any[];
    type: string;
}

export default function CampaignTableClient({ initialCampaigns, type }: CampaignTableClientProps) {
    const [campaigns, setCampaigns] = useState(initialCampaigns);

    // initialCampaigns가 변경될 때마다 campaigns 상태 업데이트
    useEffect(() => {
        setCampaigns(initialCampaigns);
    }, [initialCampaigns]);

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
        onConfirm: () => { },
        type: 'info'
    });

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
                    setCampaigns(prev => prev.filter(c => c.id !== id));
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
                    setCampaigns(prev => prev.filter(c => c.id !== id));
                }
            }
        });
    };

    if (campaigns.length === 0) {
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
            <div className="p-20 text-center text-gray-400 flex flex-col items-center bg-white">
                <div className="text-5xl mb-4">
                    {type === 'pending' ? '✨' : type === 'active' ? '📢' : type === 'upcoming' ? '⏳' : '✅'}
                </div>
                <p className="text-lg font-medium">{getEmptyMessage()}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white">
            <table className="w-full text-left table-auto">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-y border-gray-200">
                    <tr>
                        <th className="px-6 py-4 whitespace-nowrap">등록/시작일</th>
                        <th className="px-6 py-4">유형</th>
                        <th className="px-6 py-4">캠페인 정보</th>
                        <th className="px-6 py-4 whitespace-nowrap">등록자</th>
                        <th className="px-6 py-4 whitespace-nowrap">모집 현황</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">관리</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {campaigns.map((cam) => {
                        // DB 필드 기반: recruitment_start_date 사용
                        const startDate = cam.recruitment_start_date || cam.created_at;

                        return (
                            <tr key={cam.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{new Date(cam.created_at).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                        <Calendar size={12} /> {new Date(startDate).toLocaleDateString()} 시작
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        {/* 플랫폼 뱃지 */}
                                        {(() => {
                                            const p = (cam.platform || '').toUpperCase();
                                            let label = '블로그';
                                            let colorClass = 'bg-emerald-500 text-white';

                                            if (p === 'INSTAGRAM' || p === 'REELS') {
                                                label = '인스타그램';
                                                colorClass = 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
                                            } else if (p === 'YOUTUBE' || p === 'SHORTS') {
                                                label = '유튜브';
                                                colorClass = 'bg-red-500 text-white';
                                            } else if (p === 'TIKTOK') {
                                                label = '틱톡';
                                                colorClass = 'bg-slate-900 text-white';
                                            } else if (p === 'PURCHASE') {
                                                label = '구매평';
                                                colorClass = 'bg-orange-500 text-white';
                                            } else if (p === 'OTHER') {
                                                label = '기타';
                                                colorClass = 'bg-orange-500 text-white';
                                            }

                                            return (
                                                <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${colorClass}`}>
                                                    {label}
                                                </span>
                                            );
                                        })()}

                                        {/* 유형 뱃지 */}
                                        {(() => {
                                            const t = (cam.type || '').toUpperCase();
                                            let label = '방문';
                                            let colorClass = 'bg-blue-100 text-blue-700 border-blue-200';

                                            if (t === 'DELIVERY') {
                                                label = '배송';
                                                colorClass = 'bg-green-100 text-green-700 border-green-200';
                                            } else if (t === 'PURCHASE') {
                                                label = '구매';
                                                colorClass = 'bg-orange-100 text-orange-700 border-orange-200';
                                            } else if (t === 'PRESS') {
                                                label = '기자단';
                                                colorClass = 'bg-purple-100 text-purple-700 border-purple-200';
                                            }

                                            return (
                                                <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap ${colorClass}`}>
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/campaigns/${cam.id}`}
                                        className="font-bold text-gray-900 max-w-md block hover:text-primary cursor-pointer transition-colors"
                                    >
                                        {cam.title}
                                    </Link>
                                    <div className="text-xs text-gray-500 mt-1 italic">{cam.category || '카테고리 없음'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {cam.profiles ? (
                                        <div className="flex flex-col gap-1">
                                            {cam.profiles.role === 'ADMIN' ? (
                                                <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                    관리자
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
                                                    광고주
                                                </span>
                                            )}
                                            <div className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                                                {cam.profiles.nickname || cam.profiles.company_name || '이름 없음'}
                                            </div>
                                            <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{cam.profiles.email}</div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">정보 없음</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
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
                                        {cam.end_date ? `~ ${new Date(cam.end_date).toLocaleDateString()} 마감` : '상시 모집'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2 whitespace-nowrap">
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
                                            <>
                                                <Link
                                                    href={`/dashboard/admin/campaigns/${cam.id}`}
                                                    className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-bold text-xs shadow-sm"
                                                >
                                                    <Users size={14} /> 신청자 관리
                                                </Link>
                                                <Link
                                                    href={`/dashboard/campaign/new?id=${cam.id}`}
                                                    className="flex items-center gap-1 bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs"
                                                >
                                                    <Edit size={14} /> 캠페인 수정
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

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
