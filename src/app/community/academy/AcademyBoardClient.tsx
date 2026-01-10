"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, PenSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BoardList from "@/components/board/BoardList";

interface AcademyBoardClientProps {
    initialPosts: any[];
}

export default function AcademyBoardClient({ initialPosts }: AcademyBoardClientProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsLoggedIn(!!user);
        };
        checkAuth();
    }, []);

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">아카데미</h2>
                    <p className="text-gray-500 mt-1 text-sm">인플루언서와 광고주를 위한 유용한 정보와 노하우를 공유합니다</p>
                </div>
                {isLoggedIn && (
                    <Link
                        href="/community/write?type=ACADEMY"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                    >
                        <PenSquare size={18} />
                        노하우 등록
                    </Link>
                )}
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="정보 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                </div>
            </div>

            <BoardList
                items={filteredPosts}
                title="아카데미"
                viewAllHref="/community/academy"
                itemHrefPrefix="/community"
                isStandalone={true}
            />
        </div>
    );
}
