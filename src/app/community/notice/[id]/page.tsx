import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NoticeDetailPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch notice data on the server
    const { data: notice, error } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !notice) {
        console.error('Notice not found or error:', error);
        return notFound();
    }

    // Increment view count safely using RPC
    const { error: viewError } = await supabase.rpc('increment_notice_view_count', { notice_id: id });
    if (viewError) {
        console.error('Failed to increment view count:', viewError);
        // Fallback or ignore for now
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container max-w-4xl mx-auto px-4">
                {/* Back Button */}
                <Link 
                    href="/community/notice" 
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-8 font-medium"
                >
                    <ArrowLeft size={20} />
                    목록으로 돌아가기
                </Link>

                {/* Notice Content */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-3 py-1 text-xs rounded-lg font-bold ${
                                notice.type === '이벤트' 
                                    ? 'bg-orange-100 text-orange-600' 
                                    : 'bg-slate-100 text-slate-500'
                            }`}>
                                {notice.type}
                            </span>
                            {notice.is_pinned && (
                                <span className="px-3 py-1 text-xs rounded-lg font-bold bg-rose-100 text-rose-600">
                                    📌 고정
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-6">
                            {notice.title}
                        </h1>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>{notice.author || '관리자'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>
                                    {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>👁️ {(notice.view_count || 0) + 1}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div 
                            className="prose prose-lg max-w-none"
                            style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.8'
                            }}
                        >
                            {notice.content}
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-center">
                    <Link 
                        href="/community/notice"
                        className="btn btn-primary px-8 py-3"
                    >
                        목록으로
                    </Link>
                </div>
            </div>
        </div>
    );
}
