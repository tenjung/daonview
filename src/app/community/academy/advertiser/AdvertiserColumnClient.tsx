"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";
import GenerateColumnButton from "@/components/community/GenerateColumnButton";
import { useAuthStore } from "@/store/authStore";

interface AdvertiserColumnClientProps {
    initialPosts: any[];
}

export default function AdvertiserColumnClient({ initialPosts }: AdvertiserColumnClientProps) {
    const { profile } = useAuthStore();
    const isAdmin = profile?.role === 'ADMIN';

    const extraActions = isAdmin ? (
        <GenerateColumnButton
            type="ACADEMY_ADVERTISER"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20 gap-2 text-sm"
        />
    ) : null;

    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="ACADEMY_ADVERTISER"
            title="비즈니스 전략 가이드"
            description="효율적인 마케팅 집행과 성공적인 비즈니스를 위한 필승 전략"
            viewAllHref="/community/academy/advertiser"
            itemHrefPrefix="/community"
            extraActions={extraActions}
            showThumbnails={true}
        />
    );
}
