'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface InquiryDetail {
    id: string;
    created_at: string;
    category: string;
    title: string;
    content: string;
    status: 'PENDING' | 'ANSWERED';
    answer: string | null;
    answered_at: string | null;
    user_id: string;
    user: {
        email: string;
        nickname: string;
        phone_number: string;
    } | null;
}

export default function InquiryDetailClient() {
    const params = useParams();
    const router = useRouter();
    const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [answerText, setAnswerText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchInquiry = async () => {
            if (!params?.id) return;

            try {
                const { data, error } = await supabase
                    .from('inquiries')
                    .select(`
                        *,
                        user:user_id (
                            email,
                            nickname,
                            phone_number
                        )
                    `)
                    .eq('id', params.id)
                    .single();

                if (error) throw error;
                setInquiry(data as unknown as InquiryDetail);
                if (data.answer) setAnswerText(data.answer);
            } catch (error) {
                console.error('Error fetching inquiry:', error);
                toast.error('문의 정보를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInquiry();
    }, [params?.id]);

    const handleAnswerSubmit = async () => {
        if (!answerText.trim() || !inquiry) {
            toast.error('내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('inquiries')
                .update({
                    answer: answerText,
                    status: 'ANSWERED',
                    answered_at: new Date().toISOString()
                })
                .eq('id', params.id);

            if (error) throw error;

            // 사용자에게 알림 발송
            if (inquiry.user_id) {
                await supabase.from('notifications').insert({
                    user_id: inquiry.user_id,
                    type: 'INQUIRY',
                    title: '💬 문의하신 내용에 답변이 등록되었습니다.',
                    content: `제목: ${inquiry.title}\n관리자의 답변이 등록되었습니다. 상세 내용을 확인해보세요.`,
                    link: `/contact` // 사용자가 본인의 문의 내역을 확인할 수 있는 페이지
                });
            }

            toast.success('답변이 등록되었습니다.');
            setInquiry(prev => prev ? { ...prev, status: 'ANSWERED', answer: answerText, answered_at: new Date().toISOString() } : null);
        } catch (error) {
            console.error('Error submitting answer:', error);
            toast.error('답변 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryLabel = (category: string) => {
        const categories: Record<string, string> = {
            'EXPERIENCE': '체험단 문의',
            'POINT': '포인트/정산',
            'ERROR': '오류 신고',
            'AD_PARTNERSHIP': '제휴/광고',
        };
        return categories[category] || category;
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">로딩중...</div>;
    if (!inquiry) return <div className="p-8 text-center text-slate-500">문의를 찾을 수 없습니다.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard/admin/contact" className="text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-4 text-sm font-medium transition-colors w-fit">
                    <ChevronLeft size={16} />
                    목록으로 돌아가기
                </Link>
                <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-block whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold ${inquiry.status === 'ANSWERED'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                        }`}>
                        {inquiry.status === 'ANSWERED' ? '답변완료' : '접수대기'}
                    </span>
                    <span className="text-sm text-primary font-bold">{getCategoryLabel(inquiry.category)}</span>
                    <span className="text-sm text-slate-400 ml-auto font-medium">
                        {format(new Date(inquiry.created_at), 'yyyy.MM.dd HH:mm')}
                    </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900">{inquiry.title}</h1>
            </div>

            {/* 문의 내용 */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                        {inquiry.user?.nickname?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 text-lg">{inquiry.user?.nickname}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{inquiry.user?.email}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{inquiry.user?.phone_number || '연락처 없음'}</span>
                        </div>
                    </div>
                </div>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[100px] text-base">
                    {inquiry.content}
                </div>
            </div>

            {/* 답변 입력 Form */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                    <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black">A</span>
                    관리자 답변
                    {inquiry.status === 'ANSWERED' && (
                        <span className="text-xs font-normal text-slate-400 ml-auto">
                            최종 처리: {inquiry.answered_at && format(new Date(inquiry.answered_at), 'yyyy.MM.dd HH:mm')}
                        </span>
                    )}
                </h3>
                <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px] mb-4 bg-white text-base leading-relaxed resize-none shadow-sm"
                    placeholder="고객님께 남길 답변 내용을 입력해주세요."
                ></textarea>
                <div className="flex justify-end">
                    <button
                        onClick={handleAnswerSubmit}
                        disabled={isSubmitting}
                        className="btn btn-primary px-8 py-3 font-bold text-base shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? '처리 중...' : (inquiry.status === 'ANSWERED' ? '답변 수정하기' : '답변 등록하기')}
                    </button>
                </div>
            </div>
        </div>
    );
}
