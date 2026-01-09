'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function UpdateReviewsPage() {
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
            // 1. author_name이 없는 모든 리뷰 가져오기 (모든 플랫폼)
            const { data: reviews, error } = await supabase
                .from('reviews')
                .select('id, review_url, title, platform')
                .is('author_name', null)
                .in('platform', ['NAVER_BLOG', 'INSTAGRAM']); // 크롤링 지원 플랫폼만

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                addLog('✅ 업데이트할 리뷰가 없습니다');
                toast.success('모든 리뷰가 최신 상태입니다');
                setIsUpdating(false);
                return;
            }

            setProgress({ current: 0, total: reviews.length });
            addLog(`📊 총 ${reviews.length}개의 리뷰를 업데이트합니다`);

            // 2. 각 리뷰 업데이트
            for (let i = 0; i < reviews.length; i++) {
                const review = reviews[i];
                setProgress({ current: i + 1, total: reviews.length });
                
                try {
                    const platformEmoji = review.platform === 'NAVER_BLOG' ? '📝' : 
                                        review.platform === 'INSTAGRAM' ? '📷' : '🔗';
                    addLog(`${platformEmoji} [${i + 1}/${reviews.length}] ${review.platform} - ${review.review_url} 처리 중...`);

                    // 크롤링 API 호출
                    const response = await fetch('/api/scrape-blog', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: review.review_url })
                    });

                    // 404 또는 크롤링 실패 시 숨김 처리
                    if (!response.ok) {
                        // 게시물이 삭제된 경우 숨김 처리
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
                            addLog(`❌ [${i + 1}/${reviews.length}] 숨김 처리 실패`);
                        }
                        
                        // Rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }

                    const result = await response.json();

                    if (result.success && result.data) {
                        // 서버 API를 통해 업데이트 (RLS 우회)
                        const updateResponse = await fetch('/api/update-review', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                reviewId: review.id,
                                data: result.data
                            })
                        });

                        if (!updateResponse.ok) {
                            throw new Error('DB 업데이트 실패');
                        }

                        addLog(`✅ [${i + 1}/${reviews.length}] ${result.data.authorName} - ${result.data.title}`);
                    } else {
                        addLog(`⚠️ [${i + 1}/${reviews.length}] 데이터 추출 실패`);
                    }

                    // Rate limiting (1초 대기)
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
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">리뷰 데이터 업데이트</h1>
                    <p className="text-gray-500 mb-8">
                        기존 리뷰의 닉네임과 썸네일을 자동으로 업데이트합니다
                    </p>

                    {/* 진행 상황 */}
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

                    {/* 버튼 */}
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

                    {/* 로그 */}
                    {logs.length > 0 && (
                        <div className="bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-1 font-mono text-xs">
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`${
                                            log.includes('✅') ? 'text-green-400' :
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
        </div>
    );
}
