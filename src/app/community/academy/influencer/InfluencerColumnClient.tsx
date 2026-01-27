"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, PenSquare, Calendar, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";

interface InfluencerColumnClientProps {
    initialPosts: any[];
}

export default function InfluencerColumnClient({ initialPosts }: InfluencerColumnClientProps) {
    const { user, profile } = useAuthStore();
    const [posts, setPosts] = useState(initialPosts);

    // Props 동기화
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const isAdmin = profile?.role === 'ADMIN';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-primary" size={24} />
                        인플루언서 칼럼
                    </h1>
                    <p className="text-gray-500 mt-1">인플루언서 성장을 위한 꿀팁과 노하우</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-3">
                        <button
                            onClick={async () => {
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
                            }}
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20 gap-2"
                        >
                            <Sparkles size={18} />
                            AI 칼럼 생성
                        </button>
                        <Link
                            href="/community/write?type=ACADEMY_INFLUENCER"
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 gap-2"
                        >
                            <PenSquare size={18} />
                            칼럼 작성
                        </Link>
                    </div>
                )}
            </div>

            {/* Posts List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {posts.length === 0 ? (
                    <div className="p-20 text-center text-gray-400">
                        <Sparkles size={48} className="mx-auto text-gray-100 mb-4" />
                        등록된 칼럼이 없습니다.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {posts.map((post) => {
                            // 본문에서 첫 번째 이미지 추출
                            const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
                            const thumbnail = imgMatch ? imgMatch[1] : null;

                            return (
                                <Link
                                    key={post.id}
                                    href={`/community/${post.id}`}
                                    className="block p-6 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex flex-col sm:flex-row items-start gap-6">
                                        {/* Thumbnail (Desktop & Tablet) */}
                                        {thumbnail ? (
                                            <div className="w-full sm:w-48 md:w-56 h-32 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm relative group-hover:shadow-md transition-shadow">
                                                <img
                                                    src={thumbnail}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full sm:w-48 md:w-56 h-32 md:h-36 flex-shrink-0 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-200 text-gray-300">
                                                <Sparkles size={24} className="mb-2 opacity-50" />
                                                <span className="text-xs font-medium">DAONVIEW</span>
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 pt-1">
                                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors mb-2.5 line-clamp-1 leading-snug">
                                                {post.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-4 leading-relaxed">
                                                {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                                            </p>
                                            <div className="flex items-center gap-4 text-xs md:text-sm text-gray-400">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Calendar size={14} />
                                                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                                                </span>
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Eye size={14} />
                                                    {post.view_count || 0}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-500 text-[10px] md:text-xs">
                                                    {(post.profiles as any)?.nickname || '관리자'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
