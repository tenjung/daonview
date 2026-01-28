"use client";

import CommunityBoardClient from "@/components/community/CommunityBoardClient";
import { Sparkles } from "lucide-react";

interface InfluencerColumnClientProps {
    initialPosts: any[];
}

export default function InfluencerColumnClient({ initialPosts }: InfluencerColumnClientProps) {
    const handleGenerateAI = async () => {
        if (!confirm('AI 칼럼을 생성하시겠습니까?')) return;

        try {
            const response = await fetch('/api/admin/generate-column', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ACADEMY_INFLUENCER' }),
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

    const extraActions = (
        <button
            onClick={handleGenerateAI}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20 gap-2 text-sm"
        >
            <Sparkles size={18} />
            AI 칼럼 생성
        </button>
    );

    return (
        <CommunityBoardClient
            initialPosts={initialPosts}
            type="ACADEMY_INFLUENCER"
            title="인플루언서 칼럼"
            description="인플루언서 성장을 위한 꿀팁과 노하우"
            viewAllHref="/community/academy/influencer"
            itemHrefPrefix="/community"
            extraActions={extraActions}
            showThumbnails={true}
        />
    );
}
