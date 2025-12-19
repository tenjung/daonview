"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, PenSquare, Calendar, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AdvertiserColumnClientProps {
    initialPosts: any[];
}

export default function AdvertiserColumnClient({ initialPosts }: AdvertiserColumnClientProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [isAdmin, setIsAdmin] = useState(false);

    // Props 동기화
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    // 관리자 권한 체크
    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setIsAdmin(profile?.role === 'ADMIN');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-primary" size={24} />
                        광고주 칼럼
                    </h1>
                    <p className="text-gray-500 mt-1">광고주를 위한 마케팅 인사이트와 전략</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/community/write?type=ACADEMY_ADVERTISER"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                        <PenSquare size={18} />
                        칼럼 작성
                    </Link>
                )}
            </div>

            {/* Posts List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {posts.length === 0 ? (
                    <div className="p-20 text-center text-gray-400">
                        <BookOpen size={48} className="mx-auto text-gray-100 mb-4" />
                        등록된 칼럼이 없습니다.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/community/${post.id}`}
                                className="block p-6 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-2 line-clamp-1">
                                            {post.title}
                                        </h3>
                                        <div 
                                            className="text-gray-500 text-sm line-clamp-2 mb-3"
                                            dangerouslySetInnerHTML={{ 
                                                __html: post.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
                                            }}
                                        />
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(post.created_at).toLocaleDateString('ko-KR')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye size={12} />
                                                {post.view_count || 0}
                                            </span>
                                            <span>
                                                {(post.profiles as any)?.nickname || '관리자'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
