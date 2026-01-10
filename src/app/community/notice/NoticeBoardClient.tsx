"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import BoardList from "@/components/board/BoardList";

interface NoticeBoardClientProps {
    initialPosts: any[];
}

export default function NoticeBoardClient({ initialPosts }: NoticeBoardClientProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.profiles?.nickname || post.profiles?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">공지사항</h2>
                <p className="text-gray-500 mt-1 text-sm">다온뷰의 중요한 소식을 전해드립니다</p>
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="제목으로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                </div>
            </div>

            <BoardList
                items={filteredPosts}
                title="공지사항"
                viewAllHref="/community/notice"
                itemHrefPrefix="/community/notice"
                isStandalone={true}
            />
        </div>
    );
}
