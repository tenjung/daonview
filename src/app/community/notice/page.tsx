import Link from "next/link";
import { supabase } from '@/lib/supabaseClient';
import { Bell, Pin } from 'lucide-react';

interface Notice {
    id: number;
    type: string;
    title: string;
    content: string | null;
    is_pinned: boolean;
    view_count: number;
    created_at: string;
}

export default async function NoticePage() {
    // Fetch notices from database
    const { data: notices } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    // Check if user is admin (server-side)
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        
        isAdmin = profile?.role === 'ADMIN';
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case '공지': return 'bg-blue-100 text-blue-700';
            case '이벤트': return 'bg-rose-100 text-primary';
            case '업데이트': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="container py-16 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary" />
                        이벤트 & 공지사항
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 font-medium">다온뷰의 새로운 소식과 이벤트를 확인하세요</p>
                </div>
                {isAdmin && (
                    <Link 
                        href="/dashboard/admin/notices/new" 
                        className="btn btn-primary px-6 py-2.5 text-sm font-bold rounded-xl shadow-lg shadow-primary/20"
                    >
                        + 공지 작성
                    </Link>
                )}
            </div>

            {!notices || notices.length === 0 ? (
                <div className="p-16 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium text-lg">등록된 공지사항이 없습니다.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    {notices.map((notice: Notice, index: number) => (
                        <Link
                            key={notice.id}
                            href={`/community/notice/${notice.id}`}
                            className={`flex flex-col md:flex-row md:items-center py-5 px-6 hover:bg-gray-50 transition-colors group ${
                                index !== notices.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                        >
                            {/* Date */}
                            <div className="text-gray-400 text-sm w-28 mb-2 md:mb-0 font-medium">
                                {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                }).replace(/\. /g, '.').replace(/\.$/, '')}
                            </div>

                            {/* Title & Type */}
                            <div className="flex-1 flex items-center gap-3">
                                {notice.is_pinned && (
                                    <Pin className="w-4 h-4 text-primary shrink-0" />
                                )}
                                <span className={`inline-block ${getTypeColor(notice.type)} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0`}>
                                    {notice.type}
                                </span>
                                <span className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                                    {notice.title}
                                </span>
                            </div>

                            {/* View Count */}
                            <div className="text-gray-400 text-xs mt-2 md:mt-0 md:w-24 md:text-right font-medium">
                                조회 {notice.view_count}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
