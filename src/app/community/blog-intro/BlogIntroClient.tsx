"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";

interface BlogIntroClientProps {
    initialPosts: any[];
}

export default function BlogIntroClient({ initialPosts }: BlogIntroClientProps) {
    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="BLOG_INTRO"
            title="내 블로그 소개"
            description="나의 블로그를 소개하고 홍보해보세요"
            viewAllHref="/community/blog-intro"
            itemHrefPrefix="/community"
            hideBadge={true}
        />
    );
}
