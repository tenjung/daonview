"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, PenSquare, Calendar, Eye, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import BoardList from "@/components/board/BoardList";

interface BlogIntroClientProps {
    initialPosts: any[];
}

export default function BlogIntroClient({ initialPosts }: BlogIntroClientProps) {
    const { user } = useAuthStore();
    const [posts, setPosts] = useState(initialPosts);

    // Props 동기화
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const isLoggedIn = !!user;

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

            {/* Posts List */}
            <BoardList 
                items={posts} 
                title="내 블로그 소개" 
                viewAllHref="/community/blog-intro" 
                isStandalone={true} 
            />
        </div>
    );
}
