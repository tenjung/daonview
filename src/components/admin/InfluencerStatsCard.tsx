'use client';

import { InfluencerStats } from '@/types/database';
import { TrendingUp, Users, Eye, Heart, MessageCircle, Award, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { calculateCompatibility } from '@/lib/calculateCompatibility';

interface InfluencerStatsCardProps {
    stats: InfluencerStats | null;
    loading?: boolean;
    onRefresh?: () => void;
    campaignTitle?: string; // 캠페인 제목 (적합도 계산용)
    campaignCategory?: string; // 캠페인 카테고리 (적합도 계산용)
}

export default function InfluencerStatsCard({ stats, loading, onRefresh, campaignTitle, campaignCategory }: InfluencerStatsCardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onRefresh && !isRefreshing) {
            setIsRefreshing(true);
            await onRefresh();
            setIsRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    블로그 분석 중...
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">블로그 통계 없음</p>
                    {onRefresh && (
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {isRefreshing ? '분석 중...' : '지금 분석하기'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 영향력 점수에 따른 등급 (블로그 통계용)
    const getScoreGrade = (score: number) => {
        if (score >= 80) return { label: 'S급', color: 'text-purple-600 bg-purple-100' };
        if (score >= 60) return { label: 'A급', color: 'text-blue-600 bg-blue-100' };
        if (score >= 40) return { label: 'B급', color: 'text-green-600 bg-green-100' };
        if (score >= 20) return { label: 'C급', color: 'text-yellow-600 bg-yellow-100' };
        return { label: 'D급', color: 'text-gray-600 bg-gray-100' };
    };

    const influenceGrade = getScoreGrade(stats.influence_score);

    // 적합도 계산
    const compatibility = campaignTitle
        ? calculateCompatibility(campaignTitle, stats.main_categories || [], campaignCategory)
        : null;

    // 적합도 등급 색상
    const getCompatibilityColor = (grade: string) => {
        switch (grade) {
            case 'S급': return 'text-purple-600 bg-purple-100 border-purple-300';
            case 'A급': return 'text-blue-600 bg-blue-100 border-blue-300';
            case 'B급': return 'text-green-600 bg-green-100 border-green-300';
            case 'C급': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
            case 'D급': return 'text-gray-600 bg-gray-100 border-gray-300';
            default: return 'text-gray-600 bg-gray-100 border-gray-300';
        }
    };

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-shadow">
                    <Award className="text-blue-600" size={16} />
                    {compatibility ? (
                        <>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getCompatibilityColor(compatibility.grade)}`}>
                                {compatibility.grade}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                                적합도 <span className="text-blue-600">{compatibility.score}점</span>
                            </span>
                        </>
                    ) : (
                        <>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${influenceGrade.color}`}>
                                {influenceGrade.label}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                                영향력 <span className="text-blue-600">{stats.influence_score}점</span>
                            </span>
                        </>
                    )}
                    {onRefresh && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRefresh();
                            }}
                            disabled={isRefreshing}
                            className="p-1 hover:bg-white/50 rounded transition-colors"
                            title="새로고침"
                        >
                            <RefreshCw
                                size={12}
                                className={`text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                        </button>
                    )}
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="bottom" align="start">
                <div className="space-y-3">
                    {/* 적합도 상세 정보 */}
                    {compatibility && (
                        <div className="pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="text-blue-600" size={16} />
                                <span className="text-sm font-bold text-gray-900">캠페인 적합도</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div>• 점수: <span className="font-bold text-blue-600">{compatibility.score}점</span></div>
                                <div>• 등급: <span className={`font-bold px-1.5 py-0.5 rounded ${getCompatibilityColor(compatibility.grade)}`}>{compatibility.grade}</span></div>
                                <div>• 이유: {compatibility.reason}</div>
                                {compatibility.matchedCategories.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {compatibility.matchedCategories.map((cat, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 블로그 영향력 */}
                    <div className="pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="text-purple-600" size={16} />
                            <span className="text-sm font-bold text-gray-900">블로그 영향력</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${influenceGrade.color}`}>
                                {influenceGrade.label}
                            </span>
                            <span className="text-lg font-bold text-purple-600">
                                {stats.influence_score}점
                            </span>
                        </div>
                    </div>

                    {/* 주요 지표 */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* 일 방문자 */}
                        <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Eye size={14} className="text-blue-500" />
                                <span className="text-xs text-gray-600">일 방문자</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-bold text-gray-900">
                                    {stats.visitor_today.toLocaleString()}
                                </span>
                                {stats.visitor_yesterday > 0 && (
                                    <span className="text-xs text-gray-400">
                                        (어제 {stats.visitor_yesterday.toLocaleString()})
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 이웃 수 */}
                        <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Users size={14} className="text-purple-500" />
                                <span className="text-xs text-gray-600">이웃</span>
                            </div>
                            <div className="text-base font-bold text-gray-900">
                                {stats.neighbor_count.toLocaleString()}
                            </div>
                        </div>

                        {/* 평균 좋아요 */}
                        <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Heart size={14} className="text-red-500" />
                                <span className="text-xs text-gray-600">평균 좋아요</span>
                            </div>
                            <div className="text-base font-bold text-gray-900">
                                {stats.avg_likes.toFixed(1)}
                            </div>
                        </div>

                        {/* 평균 댓글 */}
                        <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                                <MessageCircle size={14} className="text-green-500" />
                                <span className="text-xs text-gray-600">평균 댓글</span>
                            </div>
                            <div className="text-base font-bold text-gray-900">
                                {stats.avg_comments.toFixed(1)}
                            </div>
                        </div>
                    </div>

                    {/* 주요 카테고리 */}
                    {stats.main_categories && stats.main_categories.length > 0 && (
                        <div>
                            <div className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                                <TrendingUp size={12} />
                                주요 카테고리
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {stats.main_categories.map((category, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 bg-white text-xs text-gray-700 rounded-full border border-gray-200"
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 전체 방문자 */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        전체 방문자: <span className="font-bold text-gray-700">{stats.visitor_total.toLocaleString()}</span>
                        {stats.last_crawled_at && (
                            <span className="ml-2">
                                · 업데이트: {new Date(stats.last_crawled_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
