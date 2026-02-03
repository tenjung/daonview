'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Sparkles, ExternalLink, Eye, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { INFLUENCER_LINKS } from '@/constants/navigation';

export default function InfluencerLandingPagesPage() {
    const { user, profile, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const [landingPages, setLandingPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            if (profile?.role === 'ADVERTISER') {
                router.replace('/dashboard/advertiser/landing-pages');
                return;
            }
            fetchLandingPages();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user, profile, router]);

    async function fetchLandingPages() {
        if (!user) return;

        try {
            const res = await fetch('/api/landing-pages');
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            setLandingPages(data.landingPages || []);
        } catch (error) {
            console.error('Error fetching landing pages:', error);
            toast.error('랜딩페이지를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-gray-500 font-bold">랜딩페이지를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar
                userType="INFLUENCER"
                userName={profile?.nickname || '사용자'}
                links={INFLUENCER_LINKS.map(link => ({
                    ...link,
                    active: link.href === '/dashboard/influencer/landing-pages'
                }))}
            />

            <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                                <Sparkles className="w-10 h-10 text-primary" />
                                나의 AI 랜딩페이지
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">
                                AI로 생성한 랜딩페이지를 관리하고 공유하세요.
                            </p>
                        </div>
                        <Link
                            href="/ai-service/landing-builder"
                            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-1 active:translate-y-0"
                        >
                            <Plus size={20} /> 새 랜딩페이지 만들기
                        </Link>
                    </div>

                    {/* Landing Pages Grid */}
                    {landingPages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {landingPages.map((page) => (
                                <div
                                    key={page.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                {page.title}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {new Date(page.created_at).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Eye size={16} />
                                            <span>{page.view_count || 0} 조회</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/lp/${page.slug}`}
                                            target="_blank"
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary hover:text-white transition-all"
                                        >
                                            <ExternalLink size={16} />
                                            보기
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                아직 생성된 랜딩페이지가 없습니다
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                AI 랜딩페이지 빌더로 1분 안에 전문적인 랜딩페이지를 만들어보세요.
                            </p>
                            <Link
                                href="/ai-service/landing-builder"
                                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
                            >
                                <Sparkles size={24} />
                                첫 랜딩페이지 만들기
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
