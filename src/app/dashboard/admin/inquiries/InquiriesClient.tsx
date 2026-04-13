'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Building2, Download, FileText, Loader2, Mail, Phone, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getPartnerInquiryFileUrl } from '@/app/actions/inquiry';

type PartnerInquiry = {
    id: string;
    company_name: string;
    manager_name: string;
    phone: string;
    email: string | null;
    message: string | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
    created_at: string;
    updated_at: string | null;
    requested_channels?: string[] | null;
    product_file_path?: string | null;
    product_file_name?: string | null;
    product_file_mime?: string | null;
    product_file_size?: number | null;
    inquiry_source?: string | null;
};

const CHANNEL_LABELS: Record<string, string> = {
    OFFLINE: '오프라인',
    CLOSED_MALL: '폐쇄몰',
    GROUP_BUY: '공동구매',
    GLOBAL: '해외',
    RECOMMEND_ALL: '전체 추천',
};

const formatChannels = (channels?: string[] | null) => {
    if (!channels || channels.length === 0) return '미선택';
    return channels.map((channel) => CHANNEL_LABELS[channel] || channel).join(', ');
};

const formatFileSize = (size?: number | null) => {
    if (!size) return '';
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

export default function InquiriesClient() {
    const [inquiries, setInquiries] = useState<PartnerInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<PartnerInquiry | null>(null);
    const [downloadingFilePath, setDownloadingFilePath] = useState<string | null>(null);

    const fetchInquiries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('partner_inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setInquiries(data as PartnerInquiry[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        let ignore = false;

        const loadInquiries = async () => {
            const { data, error } = await supabase
                .from('partner_inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (ignore) return;

            if (!error && data) {
                setInquiries(data as PartnerInquiry[]);
            }
            setLoading(false);
        };

        void loadInquiries();

        return () => {
            ignore = true;
        };
    }, []);

    const updateStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'PENDING' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'RESOLVED' : 'PENDING';
        
        const { error } = await supabase
            .from('partner_inquiries')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            toast.success('상태가 변경되었습니다.');
            fetchInquiries();
        } else {
            toast.error('상태 변경에 실패했습니다.');
        }
    };

    const handleDownloadFile = async (inquiry: PartnerInquiry) => {
        if (!inquiry.product_file_path) {
            toast.error('업로드된 제품소개서가 없습니다.');
            return;
        }

        setDownloadingFilePath(inquiry.product_file_path);
        const result = await getPartnerInquiryFileUrl(inquiry.product_file_path);
        setDownloadingFilePath(null);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        window.open(result.signedUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">제휴 문의</h1>
                <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    총 {inquiries.length}건
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-sm font-semibold text-slate-600">
                                <th className="p-4 whitespace-nowrap">접수일</th>
                                <th className="p-4 whitespace-nowrap">회사명</th>
                                <th className="p-4 whitespace-nowrap">담당자명</th>
                                <th className="p-4 whitespace-nowrap">연락처</th>
                                <th className="p-4 whitespace-nowrap">희망 채널</th>
                                <th className="p-4 whitespace-nowrap">제품소개서</th>
                                <th className="p-4 min-w-[200px]">문의 내용</th>
                                <th className="p-4 text-center whitespace-nowrap">진행 상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-400 mb-3" />
                                        데이터를 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 font-medium bg-slate-50/30">
                                        아직 접수된 제휴 문의가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                inquiries.map((inquiry) => (
                                    <tr 
                                        key={inquiry.id} 
                                        onClick={() => setSelectedInquiry(inquiry)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                                            {format(new Date(inquiry.created_at), 'yyyy. MM. dd HH:mm')}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-800 whitespace-nowrap">
                                            {inquiry.company_name}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700 whitespace-nowrap">
                                            {inquiry.manager_name}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                                            {inquiry.phone}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
                                            {formatChannels(inquiry.requested_channels)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                                            {inquiry.product_file_path ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadFile(inquiry);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
                                                >
                                                    {downloadingFilePath === inquiry.product_file_path ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Download className="h-3.5 w-3.5" />
                                                    )}
                                                    다운로드
                                                </button>
                                            ) : (
                                                <span className="text-slate-300">없음</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 break-keep max-w-[200px] truncate">
                                            {inquiry.message || <span className="text-slate-300 italic">내용 없음</span>}
                                        </td>
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateStatus(inquiry.id, inquiry.status);
                                                }}
                                                className={`px-3 py-1 text-xs font-bold font-sans rounded-full transition-all border shadow-sm ${
                                                    inquiry.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' :
                                                    inquiry.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' :
                                                    'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                }`}
                                            >
                                                {inquiry.status === 'PENDING' ? '대기중' : inquiry.status === 'IN_PROGRESS' ? '확인중' : '답변완료'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 상세 보기 모달 */}
            <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-4">
                            제휴 문의 상세
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedInquiry && (
                        <div className="py-2 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                                        <Building2 className="w-4 h-4" /> 회사명
                                    </div>
                                    <div className="text-base font-bold text-slate-900">{selectedInquiry.company_name}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                                        <UserCircle2 className="w-4 h-4" /> 담당자명
                                    </div>
                                    <div className="text-base font-medium text-slate-800">{selectedInquiry.manager_name}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                                        <Phone className="w-4 h-4" /> 연락처
                                    </div>
                                    <div className="text-base font-medium text-slate-800">{selectedInquiry.phone}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                                        <Mail className="w-4 h-4" /> 수신 상태
                                    </div>
                                    <div className="text-sm font-bold">
                                        {selectedInquiry.status === 'PENDING' ? <span className="text-amber-600">대기중</span> : 
                                         selectedInquiry.status === 'IN_PROGRESS' ? <span className="text-blue-600">확인중</span> : 
                                         <span className="text-green-600">답변완료</span>}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                                        <FileText className="w-4 h-4" /> 희망 채널
                                    </div>
                                    <div className="text-sm font-bold text-slate-800">{formatChannels(selectedInquiry.requested_channels)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                                        <Download className="w-4 h-4" /> 제품소개서
                                    </div>
                                    {selectedInquiry.product_file_path ? (
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadFile(selectedInquiry)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600"
                                        >
                                            {downloadingFilePath === selectedInquiry.product_file_path ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Download className="h-3.5 w-3.5" />
                                            )}
                                            {selectedInquiry.product_file_name || '제품소개서'}
                                            {formatFileSize(selectedInquiry.product_file_size) && (
                                                <span className="text-white/60">({formatFileSize(selectedInquiry.product_file_size)})</span>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="text-sm text-slate-400">업로드 파일 없음</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-medium text-slate-500">문의 내용</div>
                                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-800 whitespace-pre-wrap min-h-[100px] border border-slate-100">
                                    {selectedInquiry.message || <span className="text-slate-400 italic">추가 문의 내용이 없습니다.</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4 pt-4 border-t gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                                닫기
                            </button>
                        </DialogClose>
                        {selectedInquiry && selectedInquiry.status !== 'RESOLVED' && (
                            <button 
                                onClick={() => {
                                    updateStatus(selectedInquiry.id, selectedInquiry.status);
                                    setSelectedInquiry({
                                        ...selectedInquiry, 
                                        status: selectedInquiry.status === 'PENDING' ? 'IN_PROGRESS' : 'RESOLVED'
                                    });
                                }}
                                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition-colors ring-1 ring-rose-500"
                            >
                                {selectedInquiry.status === 'PENDING' ? '확인중으로 변경' : '답변완료 처리'}
                            </button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
