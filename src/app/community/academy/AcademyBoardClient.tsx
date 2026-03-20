"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";

interface AcademyBoardClientProps {
    initialPosts: any[];
}

export default function AcademyBoardClient({ initialPosts }: AcademyBoardClientProps) {
    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="ACADEMY"
            title="다온뷰 인사이트"
            description="성공적인 비즈니스와 성장을 위한 전문 가이드 및 인사이트를 공유합니다"
            viewAllHref="/community/academy"
            itemHrefPrefix="/community"
            searchPlaceholder="인사이트 검색"
        />
    );
}
