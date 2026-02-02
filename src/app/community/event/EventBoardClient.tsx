"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";

interface EventBoardClientProps {
    initialPosts: any[];
}

export default function EventBoardClient({ initialPosts }: EventBoardClientProps) {
    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="EVENT"
            title="이벤트"
            description="진행 중인 다양한 이벤트에 참여해보세요"
            searchPlaceholder="이벤트 검색"
            viewAllHref="/community/event"
            itemHrefPrefix="/community/event"
        />
    );
}
