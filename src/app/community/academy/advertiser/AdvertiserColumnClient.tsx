"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface AdvertiserColumnClientProps {
    initialPosts: any[];
}

export default function AdvertiserColumnClient({ initialPosts }: AdvertiserColumnClientProps) {
    const { profile } = useAuthStore();
    const isAdmin = profile?.role === 'ADMIN';

    const handleGenerateAI = async () => {
        if (!confirm('AI 칼럼을 생성하시겠습니까?')) return;

        try {
            const response = await fetch('/api/admin/generate-column', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ACADEMY_ADVERTISER' }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${data.message}\n⏱️ 소요 시간: ${data.duration}`);
                window.location.reload();
            } else {
                alert(`❌ 오류: ${data.error || data.details}`);
            }
        } catch (error) {
            alert('❌ 칼럼 생성 중 오류가 발생했습니다.');
            console.error(error);
        }
    };

    const extraActions = isAdmin ? (
        <button
            onClick={handleGenerateAI}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20 gap-2 text-sm"
        >
            <Sparkles size={18} />
            AI 칼럼 생성
        </button>
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
