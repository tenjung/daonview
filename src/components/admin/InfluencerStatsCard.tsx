'use client';

import { InfluencerStats } from '@/types/database';
import { Award } from 'lucide-react';

interface InfluencerStatsCardProps {
    stats: InfluencerStats | null;
    loading?: boolean;
    onRefresh?: () => void;
    campaignTitle?: string;
    campaignCategory?: string;
}

export default function InfluencerStatsCard({ stats, loading }: InfluencerStatsCardProps) {
    if (loading) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600">확인 중...</span>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
                <Award className="text-gray-500" size={16} />
                <span className="text-sm text-gray-600">통계 없음</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
            <Award className="text-gray-500" size={16} />
            <span className="text-sm text-gray-600">블로그 분석 비활성화</span>
        </div>
    );
}
