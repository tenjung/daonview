'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { X, Star, MessageSquare } from 'lucide-react';
import { RATING_TAGS, InfluencerReview } from '@/types/review';
import InfluencerReviewTags from './InfluencerReviewTags';

interface InfluencerReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    influencerId: string;
    influencerName: string;
    campaignId: string | number;
    onReviewSubmitted?: () => void;
}

export default function InfluencerReviewModal({
    isOpen,
    onClose,
    influencerId,
    influencerName,
    campaignId,
    onReviewSubmitted
}: InfluencerReviewModalProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingReviews, setExistingReviews] = useState<InfluencerReview[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);

    // 기존 평가 조회
    useEffect(() => {
        if (isOpen && influencerId) {
            loadExistingReviews();
        }
    }, [isOpen, influencerId]);

    const loadExistingReviews = async () => {
        setIsLoadingReviews(true);
        try {
            const { data, error } = await supabase
                .from('influencer_reviews')
                .select(`
                    *,
                    reviewer:profiles!influencer_reviews_reviewer_id_fkey (
                        id,
                        nickname,
                        email,
                        role,
                        company_name
                    ),
                    campaign:campaigns (
                        id,
                        title
                    )
                `)
                .eq('influencer_id', influencerId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading reviews:', error);
            } else {
                setExistingReviews(data || []);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (selectedTags.length === 0) {
            toast.error('최소 1개 이상의 평가 태그를 선택해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 현재 사용자 정보 가져오기
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('로그인이 필요합니다.');
                return;
            }

            const { error } = await supabase
                .from('influencer_reviews')
                .insert({
                    influencer_id: influencerId,
                    reviewer_id: user.id,
                    campaign_id: campaignId,
                    rating_tags: selectedTags,
                    comment: comment.trim() || null,
                });

            if (error) {
                if (error.code === '23505') {
                    toast.error('이미 이 캠페인에서 평가를 작성하셨습니다.');
                } else {
                    toast.error('평가 저장 중 오류가 발생했습니다.');
                    console.error(error);
                }
            } else {
                toast.success('평가가 저장되었습니다.');
                setSelectedTags([]);
                setComment('');
                onReviewSubmitted?.();
                loadExistingReviews(); // 목록 새로고침
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('평가 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Star className="text-yellow-500" size={24} />
                            인플루언서 평가
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {influencerName}님에 대한 평가를 작성하세요
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* 평가 태그 선택 */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">평가 태그 선택</h3>
                        <div className="space-y-3">
                            {/* 긍정 태그 */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">✅ 긍정 평가</p>
                                <div className="flex flex-wrap gap-2">
                                    {RATING_TAGS.filter(t => t.type === 'positive').map(tag => (
                                        <button
                                            key={tag.label}
                                            onClick={() => handleTagToggle(tag.label)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTags.includes(tag.label)
                                                    ? 'bg-green-600 text-white shadow-sm'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 주의 태그 */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">⚠️ 주의 사항</p>
                                <div className="flex flex-wrap gap-2">
                                    {RATING_TAGS.filter(t => t.type === 'warning').map(tag => (
                                        <button
                                            key={tag.label}
                                            onClick={() => handleTagToggle(tag.label)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTags.includes(tag.label)
                                                    ? 'bg-yellow-600 text-white shadow-sm'
                                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 부정 태그 */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">❌ 부정 평가</p>
                                <div className="flex flex-wrap gap-2">
                                    {RATING_TAGS.filter(t => t.type === 'negative').map(tag => (
                                        <button
                                            key={tag.label}
                                            onClick={() => handleTagToggle(tag.label)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTags.includes(tag.label)
                                                    ? 'bg-red-600 text-white shadow-sm'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 상세 메모 */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <MessageSquare size={16} />
                            상세 메모 (선택사항)
                        </h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="추가로 전달하고 싶은 내용을 작성해주세요..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            rows={4}
                        />
                    </div>

                    {/* 기존 평가 내역 */}
                    {existingReviews.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">
                                이전 평가 내역 ({existingReviews.length})
                            </h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {existingReviews.map(review => (
                                    <div key={review.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {review.reviewer?.nickname || review.reviewer?.company_name || '익명'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                    {review.campaign && ` · ${review.campaign.title}`}
                                                </p>
                                            </div>
                                        </div>
                                        <InfluencerReviewTags tags={review.rating_tags} />
                                        {review.comment && (
                                            <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <p className="text-sm text-gray-500">
                        선택된 태그: <span className="font-bold text-gray-900">{selectedTags.length}개</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedTags.length === 0}
                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '저장 중...' : '평가 저장'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
