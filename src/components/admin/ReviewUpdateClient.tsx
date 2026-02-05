'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function ReviewUpdateClient() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const updateAllReviews = async () => {
        setIsUpdating(true);
        setLogs([]);
        addLog('🚀 리뷰 업데이트 시작...');

        try {
            // 1. 중복 URL 정리
            addLog('🔍 중복 URL 검사 중...');
            const { data: allReviews, error: fetchError } = await supabase
                .from('reviews')
                .select('id, post_url, created_at')
                .order('post_url');

            if (fetchError) throw fetchError;

            if (allReviews && allReviews.length > 0) {
                const urlMap = new Map<string, any[]>();

                // URL별로 그룹화
                allReviews.forEach(review => {
                    if (!urlMap.has(review.post_url)) {
                        urlMap.set(review.post_url, []);
                    }
                    urlMap.get(review.post_url)!.push(review);
                });

                // 중복 찾기 및 삭제
                let duplicateCount = 0;
                for (const [url, reviews] of urlMap.entries()) {
                    if (reviews.length > 1) {
                        // 최신 것만 남기고 나머지 삭제
                        const sorted = reviews.sort((a, b) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                        const toDelete = sorted.slice(1); // 최신 것 제외하고 모두 삭제

                        for (const review of toDelete) {
                            const { error: deleteError } = await supabase
                                .from('reviews')
                                .delete()
                                .eq('id', review.id);

                            if (!deleteError) {
                                duplicateCount++;
                                addLog(`🗑️ 중복 삭제: ${url.substring(0, 50)}...`);
                            }
                        }
                    }
                }

                if (duplicateCount > 0) {
                    addLog(`✅ 중복 URL ${duplicateCount}개 정리 완료`);
                } else {
                    addLog('✅ 중복 URL 없음');
                }
            }

            const { data: reviews, error } = await supabase
                .from('reviews')
                .select('id, post_url, title, platform')
                .eq('status', 'APPROVED')
                .in('platform', ['NAVER_BLOG', 'INSTAGRAM']);

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                addLog('✅ 업데이트할 리뷰가 없습니다');
                toast.success('모든 리뷰가 최신 상태입니다');
                setIsUpdating(false);
                return;
            }

            setProgress({ current: 0, total: reviews.length });
            addLog(`📊 총 ${reviews.length}개의 리뷰를 업데이트합니다`);

            for (let i = 0; i < reviews.length; i++) {
                const review = reviews[i];
                setProgress({ current: i + 1, total: reviews.length });

                try {
                    const platformEmoji = review.platform === 'NAVER_BLOG' ? '📝' :
                        review.platform === 'INSTAGRAM' ? '📷' : '🔗';
                    addLog(`${platformEmoji} [${i + 1}/${reviews.length}] ${review.platform} - ${review.post_url} 처리 중...`);

                    const response = await fetch('/api/scrape-blog', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: review.post_url })
                    });

                    if (response.status === 404) {
                        const hideResponse = await fetch('/api/hide-review', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                reviewId: review.id,
                                status: 'HIDDEN'
                            })
                        });

                        if (hideResponse.ok) {
                            addLog(`🚫 [${i + 1}/${reviews.length}] 게시물 삭제됨 - 숨김 처리 완료`);
                        } else {
                            addLog(`⚠️ [${i + 1}/${reviews.length}] 게시물 삭제되었으나 숨김 처리 실패`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 500));
                        continue;
                    }

                    if (!response.ok) {
                        addLog(`❌ [${i + 1}/${reviews.length}] 서버 오류 (Status: ${response.status})`);
                        continue;
                    }

                    const result = await response.json();

                    if (result.success && result.data) {
                        const { title, thumbnail, authorName } = result.data;

                        // 필수 정보(제목, 썸네일)가 없거나 '제목 없음'인 경우 숨김 처리
                        const isInvalid = !title || title === '제목 없음' || !thumbnail || thumbnail === '';

                        if (isInvalid) {
                            await fetch('/api/hide-review', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ reviewId: review.id, status: 'HIDDEN' })
                            });
                            addLog(`🚫 [${i + 1}/${reviews.length}] 필수 정보(제목/썸네일) 누락 - 자동 숨김`);
                        } else {
                            const updateResponse = await fetch('/api/update-review', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    reviewId: review.id,
                                    data: result.data
                                })
                            });

                            if (!updateResponse.ok) throw new Error('DB 업데이트 실패');
                            addLog(`✅ [${i + 1}/${reviews.length}] ${authorName} - ${title}`);
                        }
                    } else {
                        // 데이터 추출 실패 시에도 숨김 처리 (게시물 삭제/비공개 등 방치된 리뷰 정리)
                        await fetch('/api/hide-review', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reviewId: review.id, status: 'HIDDEN' })
                        });
                        addLog(`🚫 [${i + 1}/${reviews.length}] 데이터 추출 불가 - 자동 숨김`);
                    }


                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error: any) {
                    addLog(`❌ [${i + 1}/${reviews.length}] 오류: ${error.message}`);
                }
            }

            addLog('✨ 모든 리뷰 업데이트 완료!');
            toast.success('리뷰 업데이트가 완료되었습니다');

        } catch (error: any) {
            addLog(`❌ 오류 발생: ${error.message}`);
            toast.error('업데이트 중 오류가 발생했습니다');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="mx-auto">
            <div className="bg-white p-0">

                {isUpdating && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-blue-700">
                                진행 중... {progress.current} / {progress.total}
                            </span>
                            <span className="text-sm text-blue-600">
                                {Math.round((progress.current / progress.total) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <Button
                    onClick={updateAllReviews}
                    disabled={isUpdating}
                    className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg mb-6"
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            업데이트 중...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-5 h-5 mr-2" />
                            리뷰 업데이트 시작
                        </>
                    )}
                </Button>

                {logs.length > 0 && (
                    <div className="bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-1 font-mono text-xs">
                            {logs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`${log.includes('✅') ? 'text-green-400' :
                                        log.includes('❌') ? 'text-red-400' :
                                            log.includes('⚠️') ? 'text-yellow-400' :
                                                log.includes('🚀') || log.includes('✨') ? 'text-blue-400' :
                                                    'text-gray-300'
                                        }`}
                                >
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
