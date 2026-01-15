'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

interface BulkResult {
    url: string;
    success: boolean;
    error?: string;
    data?: {
        id: string;
        title: string | null;
        author_name: string | null;
    };
}

export default function BulkReviewPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [urls, setUrls] = useState('');
    const [results, setResults] = useState<BulkResult[]>([]);
    const [summary, setSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!urls.trim()) {
            toast.error('URL을 입력해주세요');
            return;
        }

        // URL 파싱 (줄바꿈 또는 쉼표로 구분)
        const urlList = urls
            .split(/[\n,]/)
            .map(url => url.trim())
            .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));

        if (urlList.length === 0) {
            toast.error('유효한 URL이 없습니다');
            return;
        }

        setIsSubmitting(true);
        setResults([]);
        setSummary(null);

        try {
            if (!user) {
                toast.error('로그인이 필요합니다');
                return;
            }

            toast.info(`${urlList.length}개의 리뷰를 등록하는 중...`);

            const response = await fetch('/api/reviews/bulk-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urls: urlList,
                    userId: user.id
                })
            });

            if (!response.ok) {
                throw new Error('일괄 등록 실패');
            }

            const result = await response.json();

            setResults(result.results || []);
            setSummary(result.summary);

            if (result.summary.success > 0) {
                toast.success(`${result.summary.success}개 리뷰 등록 완료!`);
            }

            if (result.summary.failed > 0) {
                toast.warning(`${result.summary.failed}개 리뷰 등록 실패`);
            }

        } catch (error: any) {
            console.error('Error bulk creating reviews:', error);
            toast.error(error.message || '리뷰 등록 중 오류가 발생했습니다');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex-1 bg-gray-50 py-12">
                <div className="container max-w-5xl mx-auto px-4">
                    {/* 헤더 */}
                    <div className="mb-8">
                        <Link
                            href="/reviews"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium">리뷰 목록으로</span>
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">리뷰 일괄 등록</h1>
                        <p className="text-gray-500">여러 개의 리뷰 URL을 한 번에 등록하세요. 자동으로 메타데이터를 수집합니다.</p>
                    </div>

                    {/* 폼 */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm mb-8">
                        <div className="space-y-6">
                            {/* URL 입력 */}
                            <div className="space-y-2">
                                <Label htmlFor="urls" className="text-sm font-bold text-gray-700">
                                    리뷰 URL 목록 <span className="text-rose-500">*</span>
                                </Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    💡 한 줄에 하나씩 URL을 입력하거나, 쉼표로 구분하세요. 네이버 블로그와 인스타그램을 지원합니다.
                                </p>
                                <Textarea
                                    id="urls"
                                    placeholder="https://blog.naver.com/example/123456&#10;https://www.instagram.com/p/ABC123/&#10;https://blog.naver.com/another/789012"
                                    value={urls}
                                    onChange={(e) => setUrls(e.target.value)}
                                    className="min-h-[300px] resize-none font-mono text-sm"
                                    disabled={isSubmitting}
                                    required
                                />
                                <p className="text-xs text-gray-400">
                                    {urls.split(/[\n,]/).filter(u => u.trim()).length}개 URL 입력됨
                                </p>
                            </div>

                            {/* 지원 플랫폼 안내 */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-blue-900 mb-2">📱 지원 플랫폼</h3>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>✅ 네이버 블로그 - 자동 메타데이터 수집 (닉네임, 썸네일, 제목)</li>
                                    <li>✅ 인스타그램 - 자동 메타데이터 수집 (제한적)</li>
                                    <li>⚠️ 유튜브, 틱톡 - URL만 저장 (수동 입력 필요)</li>
                                </ul>
                            </div>
                        </div>

                        {/* 버튼 */}
                        <div className="flex gap-3 mt-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1 h-12"
                                disabled={isSubmitting}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        등록 중...
                                    </>
                                ) : (
                                    <>
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        일괄 등록하기
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* 결과 표시 */}
                    {summary && (
                        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">등록 결과</h2>

                            {/* 요약 */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-black text-gray-900">{summary.total}</div>
                                    <div className="text-sm text-gray-500 mt-1">전체</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-black text-green-600">{summary.success}</div>
                                    <div className="text-sm text-green-700 mt-1">성공</div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-black text-red-600">{summary.failed}</div>
                                    <div className="text-sm text-red-700 mt-1">실패</div>
                                </div>
                            </div>

                            {/* 상세 결과 */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {results.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl border-2 ${result.success
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {result.success ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-mono text-gray-600 truncate mb-1">
                                                    {result.url}
                                                </p>
                                                {result.success && result.data ? (
                                                    <p className="text-sm font-bold text-green-900">
                                                        {result.data.author_name} - {result.data.title || '제목 없음'}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-red-700">
                                                        {result.error || '등록 실패'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 완료 버튼 */}
                            <div className="mt-6">
                                <Button
                                    onClick={() => router.push('/reviews')}
                                    className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold"
                                >
                                    리뷰 목록 보기
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
