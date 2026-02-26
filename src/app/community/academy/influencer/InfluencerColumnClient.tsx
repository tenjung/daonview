"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";
import GenerateColumnButton from "@/components/community/GenerateColumnButton";
import { useAuthStore } from "@/store/authStore";

interface InfluencerColumnClientProps {
    initialPosts: any[];
}

export default function InfluencerColumnClient({ initialPosts }: InfluencerColumnClientProps) {
    const { profile } = useAuthStore();
    const isAdmin = profile?.role === 'ADMIN';

    const extraActions = isAdmin ? (
        <GenerateColumnButton
            type="ACADEMY_INFLUENCER"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20 gap-2 text-sm"
        />
    ) : null;

    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="ACADEMY_INFLUENCER"
            title="인플루언서 성장 노하우"
            description="팔로워를 사로잡는 컨텐츠 제작부터 수익화 단계까지의 핵심 비법"
            viewAllHref="/community/academy/influencer"
            itemHrefPrefix="/community"
            extraActions={extraActions}
            showThumbnails={true}
        />
    );
}
