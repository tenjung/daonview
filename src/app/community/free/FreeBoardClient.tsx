"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";

interface FreeBoardClientProps {
    initialPosts: unknown[];
}

export default function FreeBoardClient({ initialPosts }: FreeBoardClientProps) {
    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="FREE"
            title="포스팅 피드백"
            description="포스팅을 공유하고 AI 분석/서로의 피드백으로 성과를 개선하세요."
            searchPlaceholder="포스팅 제목, 작성자, 키워드 검색"
            viewAllHref="/community/feedback"
            itemHrefPrefix="/community"
            hideBadge={true}
        />
    );
}
