'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function DuplicateCleanupClient() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState<{ total: number; duplicates: number; deleted: number } | null>(null);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const cleanupDuplicates = async () => {
        setIsProcessing(true);
        setLogs([]);
        setStats(null);
        addLog('🚀 중복 URL 정리 시작...');

        try {
            // 모든 리뷰 가져오기
            const { data: allReviews, error: fetchError } = await supabase
                .from('reviews')
                .select('id, post_url, created_at, title, author_name')
                .order('post_url');

            if (fetchError) throw fetchError;

            if (!allReviews || allReviews.length === 0) {
                addLog('❌ 리뷰가 없습니다');
                toast.error('리뷰가 없습니다');
                setIsProcessing(false);
                return;
            }

            addLog(`📊 총 ${allReviews.length}개의 리뷰 검사 중...`);

            // URL별로 그룹화
            const urlMap = new Map<string, any[]>();
            allReviews.forEach(review => {
                if (!urlMap.has(review.post_url)) {
                    urlMap.set(review.post_url, []);
                }
                urlMap.get(review.post_url)!.push(review);
            });

            // 중복 찾기
            const duplicateUrls = Array.from(urlMap.entries()).filter(([_, reviews]) => reviews.length > 1);
            
            if (duplicateUrls.length === 0) {
                addLog('✅ 중복 URL이 없습니다');
                toast.success('중복 URL이 없습니다');
                setStats({ total: allReviews.length, duplicates: 0, deleted: 0 });
                setIsProcessing(false);
                return;
            }

            addLog(`⚠️ ${duplicateUrls.length}개의 중복 URL 발견`);

            // 중복 삭제
            let deletedCount = 0;
            for (const [url, reviews] of duplicateUrls) {
                addLog(`🔍 처리 중: ${url.substring(0, 60)}...`);
                addLog(`   └─ ${reviews.length}개 중복 발견`);

                // 최신 것만 남기고 나머지 삭제
                const sorted = reviews.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                
                const toKeep = sorted[0];
                const toDelete = sorted.slice(1);

                addLog(`   ✅ 유지: ID ${toKeep.id} (${toKeep.title || '제목 없음'})`);

                for (const review of toDelete) {
                    const { error: deleteError } = await supabase
                        .from('reviews')
                        .delete()
                        .eq('id', review.id);

                    if (!deleteError) {
                        deletedCount++;
                        addLog(`   🗑️ 삭제: ID ${review.id} (${review.title || '제목 없음'})`);
                    } else {
                        addLog(`   ❌ 삭제 실패: ID ${review.id} - ${deleteError.message}`);
                    }
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            setStats({
                total: allReviews.length,
                duplicates: duplicateUrls.length,
                deleted: deletedCount
            });

            addLog(`✨ 정리 완료! ${deletedCount}개의 중복 리뷰 삭제됨`);
            toast.success(`${deletedCount}개의 중복 리뷰를 삭제했습니다`);

        } catch (error: any) {
            addLog(`❌ 오류 발생: ${error.message}`);
            toast.error('중복 정리 중 오류가 발생했습니다');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm">
                {/* 헤더 */}
                <div className="mb-8">
                    <Link
                        href="/dashboard/admin/reviews/manage"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        ← 리뷰 관리로
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">중복 URL 정리</h1>
                    <p className="text-gray-500">
                        같은 URL을 가진 중복 리뷰를 찾아서 최신 것만 남기고 삭제합니다
                    </p>
                </div>

                {/* 통계 */}
                {stats && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-gray-900">{stats.total}</div>
                            <div className="text-sm text-gray-500 mt-1">전체 리뷰</div>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-yellow-600">{stats.duplicates}</div>
                            <div className="text-sm text-yellow-700 mt-1">중복 URL</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-red-600">{stats.deleted}</div>
                            <div className="text-sm text-red-700 mt-1">삭제됨</div>
                        </div>
                    </div>
                )}

                {/* 실행 버튼 */}
                <Button
                    onClick={cleanupDuplicates}
                    disabled={isProcessing}
                    className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-bold text-lg mb-6"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            정리 중...
                        </>
                    ) : (
                        <>
                            <Trash2 className="w-5 h-5 mr-2" />
                            중복 URL 정리 시작
                        </>
                    )}
                </Button>

                {/* 경고 메시지 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-bold text-yellow-900 mb-2">⚠️ 주의사항</h3>
                    <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• 같은 URL을 가진 리뷰 중 <strong>가장 최근에 등록된 것만 유지</strong>합니다</li>
                        <li>• 삭제된 리뷰는 <strong>복구할 수 없습니다</strong></li>
                        <li>• 작업 전 데이터 백업을 권장합니다</li>
                    </ul>
                </div>

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
                                        log.includes('🗑️') ? 'text-orange-400' :
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
