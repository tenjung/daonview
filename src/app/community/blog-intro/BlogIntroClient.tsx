"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, PenSquare, Calendar, Eye, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface BlogIntroClientProps {
    initialPosts: any[];
}

export default function BlogIntroClient({ initialPosts }: BlogIntroClientProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Props 동기화
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    // 로그인 상태 체크
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Newspaper className="text-primary" size={24} />
                        내 블로그 소개
                    </h1>
                    <p className="text-gray-500 mt-1">나의 블로그를 소개하고 홍보해보세요</p>
                </div>
                {isLoggedIn && (
                    <Link
                        href="/community/write?type=BLOG_INTRO"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                        <PenSquare size={18} />
                        블로그 소개하기
                    </Link>
                )}
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.length === 0 ? (
                    <div className="col-span-full p-20 bg-white rounded-2xl border border-gray-100 text-center text-gray-400">
                        <Newspaper size={48} className="mx-auto text-gray-100 mb-4" />
                        등록된 블로그 소개가 없습니다.
                    </div>
                ) : (
                    posts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/community/${post.id}`}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group"
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                    {post.title}
                                </h3>
                                <div 
                                    className="text-gray-500 text-sm line-clamp-3 mb-4"
                                    dangerouslySetInnerHTML={{ 
                                        __html: post.content.replace(/<[^>]*>?/gm, '').substring(0, 120) + '...'
                                    }}
                                />
                                <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
                                    <span className="flex items-center gap-1 font-medium">
                                        <User size={12} />
                                        {(post.profiles as any)?.nickname || '익명'}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye size={12} />
                                            {post.view_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
