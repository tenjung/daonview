"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";

interface FreeBoardClientProps {
    initialPosts: any[];
}

export default function FreeBoardClient({ initialPosts }: FreeBoardClientProps) {
    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="FREE"
            title="자유게시판"
            description="자유롭게 이야기를 나누는 공간입니다"
            viewAllHref="/community/free"
            itemHrefPrefix="/community"
            hideBadge={true}
        />
    );
}
