'use client';

import { RATING_TAGS } from '@/types/review';
import { ThumbsUp, AlertTriangle, ThumbsDown } from 'lucide-react';

interface InfluencerReviewTagsProps {
    tags: string[];
    compact?: boolean;
}

export default function InfluencerReviewTags({ tags, compact = false }: InfluencerReviewTagsProps) {
    if (!tags || tags.length === 0) {
        return null;
    }

    // 태그 타입별로 분류
    const tagsByType = tags.map(tag => {
        const tagDef = RATING_TAGS.find(t => t.label === tag);
        return {
            label: tag,
            type: tagDef?.type || 'positive'
        };
    });

    const getTagStyle = (type: string) => {
        switch (type) {
            case 'positive':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'warning':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'negative':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'positive':
                return <ThumbsUp size={10} />;
            case 'warning':
                return <AlertTriangle size={10} />;
            case 'negative':
                return <ThumbsDown size={10} />;
            default:
                return null;
        }
    };

    if (compact) {
        // 컴팩트 모드: 아이콘만 표시
        const hasPositive = tagsByType.some(t => t.type === 'positive');
        const hasWarning = tagsByType.some(t => t.type === 'warning');
        const hasNegative = tagsByType.some(t => t.type === 'negative');

        return (
            <div className="flex items-center gap-1">
                {hasPositive && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center" title="긍정 평가">
                        <ThumbsUp size={12} className="text-green-600" />
                    </div>
                )}
                {hasWarning && (
                    <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center" title="주의 평가">
                        <AlertTriangle size={12} className="text-yellow-600" />
                    </div>
                )}
                {hasNegative && (
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center" title="부정 평가">
                        <ThumbsDown size={12} className="text-red-600" />
                    </div>
                )}
            </div>
        );
    }

    // 전체 모드: 태그 전체 표시
    return (
        <div className="flex flex-wrap gap-1">
            {tagsByType.map((tag, index) => (
                <span
                    key={index}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTagStyle(tag.type)}`}
                >
                    {getIcon(tag.type)}
                    {tag.label}
                </span>
            ))}
        </div>
    );
}
