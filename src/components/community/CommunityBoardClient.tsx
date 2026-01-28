'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, PenSquare } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import BoardList from "@/components/board/BoardList";

interface CommunityBoardClientProps {
    initialPosts: any[];
    type: string;
    title: string;
    description: string;
    searchPlaceholder?: string;
    viewAllHref: string;
    itemHrefPrefix?: string;
    hideBadge?: boolean;
    extraActions?: React.ReactNode;
    showThumbnails?: boolean;
}

export default function CommunityBoardClient({
    initialPosts,
    type,
    title,
    description,
    searchPlaceholder = "제목이나 작성자로 검색",
    viewAllHref,
    itemHrefPrefix = "/community",
    hideBadge = false,
    extraActions,
    showThumbnails = false
}: CommunityBoardClientProps) {
    const { profile } = useAuthStore();
    const [posts, setPosts] = useState(initialPosts);
    const [searchQuery, setSearchQuery] = useState("");

    // Props sync
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const isAdmin = profile?.role === 'ADMIN';
    
    // Logic for showing Write button
    // 1. Admin can write everywhere
    // 2. Logged in users can write in FREE, ACADEMY_ADVERTISER, ACADEMY_INFLUENCER, BLOG_INTRO
    const canWrite = isAdmin || (
        !!profile && 
        ['FREE', 'ACADEMY_ADVERTISER', 'ACADEMY_INFLUENCER', 'BLOG_INTRO'].includes(type)
    );

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.profiles?.nickname || post.profiles?.name || post.author || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Header section with Title and Write Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="text-gray-500 mt-1 text-sm">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                    {extraActions}
                    {canWrite && (
                        <Link
                            href={`/community/write?type=${type}`}
                            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2 text-sm"
                        >
                            <PenSquare size={18} />
                            {isAdmin && (type === 'NOTICE' || type === 'EVENT') ? '공지 작성' : '글쓰기'}
                        </Link>
                    )}
                </div>
            </div>

            {/* Search Box */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                </div>
            </div>

            {/* Board List */}
            <BoardList
                items={filteredPosts}
                title={title}
                viewAllHref={viewAllHref}
                itemHrefPrefix={itemHrefPrefix}
                isStandalone={true}
                hideBadge={hideBadge}
                showThumbnails={showThumbnails}
            />
        </div>
    );
}
