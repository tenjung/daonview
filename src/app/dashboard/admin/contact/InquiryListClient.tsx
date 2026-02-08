'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Inquiry {
    id: string;
    created_at: string;
    category: string;
    title: string;
    status: 'PENDING' | 'ANSWERED';
    user: {
        email: string;
        nickname: string;
    } | null;
}

export default function InquiryListClient() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const { data, error } = await supabase
                .from('inquiries')
                .select(`
                    id,
                    created_at,
                    category,
                    title,
                    status,
                    user:user_id (
                        email,
                        nickname
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInquiries(data as unknown as Inquiry[]);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setIsLoading(false);
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

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">고객센터 문의 관리</h1>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 w-28">상태</th>
                            <th className="px-6 py-3 w-32">카테고리</th>
                            <th className="px-6 py-3">제목</th>
                            <th className="px-6 py-3 w-40">작성자</th>
                            <th className="px-6 py-3 w-32">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {inquiries.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    등록된 문의 내역이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            inquiries.map((inquiry) => (
                                <tr key={inquiry.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-block whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold ${inquiry.status === 'ANSWERED'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {inquiry.status === 'ANSWERED' ? '답변완료' : '접수대기'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        {getCategoryLabel(inquiry.category)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/dashboard/admin/contact/${inquiry.id}`}
                                            className="font-medium text-slate-900 hover:text-primary hover:underline"
                                        >
                                            {inquiry.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="font-medium text-slate-900">{inquiry.user?.nickname || '알 수 없음'}</div>
                                        <div className="text-xs text-slate-400">{inquiry.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {format(new Date(inquiry.created_at), 'yyyy-MM-dd')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
