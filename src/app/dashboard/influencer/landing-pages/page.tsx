'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Sparkles, ExternalLink, Plus, Save, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { INFLUENCER_LINKS } from '@/constants/navigation';

export default function InfluencerLandingPagesPage() {
    const { user, profile, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    interface LandingPageCard {
        id: string | number;
        slug: string;
        title: string;
        created_at: string;
        view_count?: number;
        input_data?: {
            googleFormUrl?: string;
            [key: string]: unknown;
        } | null;
    }

    const [landingPages, setLandingPages] = useState<LandingPageCard[]>([]);
    const [formUrlById, setFormUrlById] = useState<Record<string, string>>({});
    const [savingPageId, setSavingPageId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const normalizeExternalUrl = (raw: string) => {
        const value = raw.trim();
        if (!value) return '';
        return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    };

    const fetchLandingPages = useCallback(async () => {
        if (!user) return;

        try {
            const res = await fetch('/api/landing-pages');
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            const pages = (data.landingPages || []) as LandingPageCard[];
            setLandingPages(pages);
            const mapped: Record<string, string> = {};
            pages.forEach((page) => {
                mapped[String(page.id)] = String(page.input_data?.googleFormUrl || '');
            });
            setFormUrlById(mapped);
        } catch (error) {
            console.error('Error fetching landing pages:', error);
            toast.error('랜딩페이지를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, [user]);

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
    }, [authLoading, user, profile, router, fetchLandingPages]);

    async function saveGoogleFormUrl(page: LandingPageCard) {
        const pageId = String(page.id);
        const normalizedGoogleFormUrl = normalizeExternalUrl(formUrlById[pageId] || '');

        setSavingPageId(pageId);
        try {
            const mergedInputData = {
                ...(page.input_data || {}),
                googleFormUrl: normalizedGoogleFormUrl,
            };

            const res = await fetch(`/api/landing-pages/${encodeURIComponent(page.slug)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputData: mergedInputData }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || '저장 중 오류가 발생했습니다.');
            }

            setLandingPages((prev) =>
                prev.map((item) =>
                    item.id === page.id
                        ? { ...item, input_data: { ...(item.input_data || {}), googleFormUrl: normalizedGoogleFormUrl } }
                        : item
                )
            );
            setFormUrlById((prev) => ({ ...prev, [pageId]: normalizedGoogleFormUrl }));
            toast.success('구글폼 링크가 저장되었습니다.');
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : '구글폼 링크 저장에 실패했습니다.');
        } finally {
            setSavingPageId(null);
        }
    }

    async function copyLandingPageUrl(slug: string) {
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const url = `${origin}/lp/${slug}`;
            await navigator.clipboard.writeText(url);
            toast.success('랜딩페이지 주소가 복사되었습니다.');
        } catch (error) {
            console.error('Copy URL error:', error);
            toast.error('주소 복사에 실패했습니다.');
        }
    }

    async function deleteLandingPage(page: LandingPageCard) {
        if (!confirm('정말 이 랜딩페이지를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/landing-pages/${encodeURIComponent(page.slug)}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || '삭제에 실패했습니다.');
            }

            setLandingPages((prev) => prev.filter((item) => item.id !== page.id));
            setFormUrlById((prev) => {
                const next = { ...prev };
                delete next[String(page.id)];
                return next;
            });
            toast.success('랜딩페이지가 삭제되었습니다.');
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : '랜딩페이지 삭제에 실패했습니다.');
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

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5">구글폼 URL</label>
                                            <input
                                                type="url"
                                                value={formUrlById[String(page.id)] || ''}
                                                onChange={(e) =>
                                                    setFormUrlById((prev) => ({ ...prev, [String(page.id)]: e.target.value }))
                                                }
                                                placeholder="https://forms.gle/..."
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                                            />
                                        </div>

                                        <button
                                            onClick={() => saveGoogleFormUrl(page)}
                                            disabled={savingPageId === String(page.id)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                        >
                                            <Save size={15} />
                                            {savingPageId === String(page.id) ? '저장 중...' : '구글폼 저장'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        <Link
                                            href={`/lp/${page.slug}`}
                                            target="_blank"
                                            className="h-11 flex items-center justify-center gap-1.5 px-3 bg-emerald-50 text-emerald-700 rounded-lg font-bold hover:bg-emerald-100 transition-all whitespace-nowrap text-sm"
                                        >
                                            <ExternalLink size={14} />
                                            열기
                                        </Link>
                                        <button
                                            onClick={() => copyLandingPageUrl(page.slug)}
                                            className="h-11 flex items-center justify-center gap-1.5 px-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all whitespace-nowrap text-sm"
                                        >
                                            <Copy size={14} />
                                            복사
                                        </button>
                                        <button
                                            onClick={() => deleteLandingPage(page)}
                                            className="h-11 flex items-center justify-center gap-1.5 px-3 bg-rose-50 text-rose-600 rounded-lg font-bold hover:bg-rose-100 transition-all whitespace-nowrap text-sm"
                                        >
                                            <Trash2 size={14} />
                                            삭제
                                        </button>
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
