"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Pin, PenSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface NoticeBoardClientProps {
    initialPosts: any[];
}

export default function NoticeBoardClient({ initialPosts }: NoticeBoardClientProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [isAdmin, setIsAdmin] = useState(false);

    // initialPosts가 변경될 때마다 posts 상태 업데이트
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

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
                        <Bell className="text-primary" size={24} />
                        공지사항
                    </h1>
                    <p className="text-gray-500 mt-1">다온뷰의 새로운 소식과 안내를 확인하세요.</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/community/write?type=NOTICE"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                        <PenSquare size={18} />
                        공지 작성
                    </Link>
                )}
            </div>

            {/* 목록 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-50">
                    {posts.length === 0 ? (
                        <div className="p-20 text-center text-gray-400">
                            <Bell size={48} className="mx-auto text-gray-100 mb-4" />
                            등록된 공지사항이 없습니다.
                        </div>
                    ) : (
                        posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/community/notice/${post.id}`}
                                className={`block p-6 hover:bg-gray-50 transition-colors group ${post.is_pinned ? 'bg-primary/5' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {post.is_pinned && (
                                                <span className="flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    <Pin size={10} />
                                                    공지
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                                            {post.title}
                                        </h3>
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">
                                        조회 {post.view_count || 0}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
