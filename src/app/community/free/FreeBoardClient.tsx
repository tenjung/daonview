"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, PenSquare, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface FreeBoardClientProps {
    initialPosts: any[];
}

export default function FreeBoardClient({ initialPosts }: FreeBoardClientProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [searchQuery, setSearchQuery] = useState("");
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

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.profiles?.nickname || post.profiles?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">자유게시판</h1>
                    <p className="text-gray-500 mt-1">자유롭게 이야기를 나누는 공간입니다.</p>
                </div>
                {isLoggedIn && (
                    <Link
                        href="/community/write?type=FREE"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                        <PenSquare size={18} />
                        글쓰기
                    </Link>
                )}
            </div>

            {/* 검색 및 필터 */}
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="제목이나 작성자로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                </div>
            </div>

            {/* 게시글 목록 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100 font-bold">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">번호</th>
                                <th className="px-6 py-4">제목</th>
                                <th className="px-6 py-4 w-32">작성자</th>
                                <th className="px-6 py-4 w-32 text-center">작성일</th>
                                <th className="px-6 py-4 w-20 text-center">조회</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <MessageSquare size={48} className="text-gray-200 mb-2" />
                                            <p>등록된 게시글이 없습니다.</p>
                                            <p className="text-xs">첫 번째 주인공이 되어보세요!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map((post, index) => (
                                    <tr key={post.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 text-center text-gray-400 font-medium">
                                            {posts.length - index}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/community/${post.id}`} className="block">
                                                <span className="text-gray-900 font-bold group-hover:text-primary transition-colors">
                                                    {post.title}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {post.profiles?.nickname || post.profiles?.name || '익명'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-400">
                                            {new Date(post.created_at).toLocaleDateString('ko-KR', {
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-400">
                                            {post.view_count || 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
