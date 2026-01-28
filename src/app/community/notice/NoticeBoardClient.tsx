"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";

interface NoticeBoardClientProps {
    initialPosts: any[];
}

export default function NoticeBoardClient({ initialPosts }: NoticeBoardClientProps) {
    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="NOTICE"
            title="공지사항"
            description="다온뷰의 중요한 소식을 전해드립니다"
            searchPlaceholder="공지사항 검색"
            viewAllHref="/community/notice"
            itemHrefPrefix="/community/notice"
        />
    );
}
