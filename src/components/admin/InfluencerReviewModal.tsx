'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { X, Star, MessageSquare, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { RATING_TAGS, InfluencerReview, SatisfactionLevel } from '@/types/review';
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
    const [satisfaction, setSatisfaction] = useState<SatisfactionLevel | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingReviews, setExistingReviews] = useState<InfluencerReview[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);

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
                    id,
                    influencer_id,
                    reviewer_id,
                    campaign_id,
                    satisfaction,
                    rating_tags,
                    comment,
                    created_at,
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
                const reviews = (data || []) as any[];
                setExistingReviews(reviews);
                
                // 현재 캠페인에 대한 평가가 이미 있는지 확인
                const hasReviewed = reviews.some(r => Number(r.campaign_id) === Number(campaignId));
                setAlreadyReviewed(hasReviewed);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    const handleTagToggle = (tag: string) => {
        if (alreadyReviewed) return; // 이미 평가했으면 수정 불가
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (alreadyReviewed) return;

        if (!satisfaction) {
            toast.error('만족도를 선택해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 현재 사용자 정보 가져오기
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('로그인이 필요합니다.');
                setIsSubmitting(false);
                return;
            }

            // 전송 데이터 사전 검증 로깅
            const payload = {
                influencer_id: influencerId,
                reviewer_id: user.id,
                campaign_id: isNaN(Number(campaignId)) ? null : Number(campaignId),
                satisfaction: satisfaction,
                rating_tags: selectedTags,
                comment: comment.trim() || null,
            };

            console.log('Attempting to save review with payload:', payload);

            const { error } = await supabase
                .from('influencer_reviews')
                .insert(payload);

            if (error) {
                // 에러 객체의 모든 정보를 문자열로 강제 변환하여 로깅
                console.error('Supabase save error details:', JSON.stringify(error, null, 2));

                if (error.code === '23505') {
                    toast.error('이미 이 캠페인에서 평가를 작성하셨습니다.');
                } else if (error.code === '42501') {
                    toast.error('권한이 없습니다. (RLS Policy Violation)');
                } else {
                    toast.error(`저장 실패 [${error.code}]: ${error.message || '상세 사유 없음'}`);
                }
            } else {
                toast.success('평가가 저장되었습니다.');
                setSelectedTags([]);
                setSatisfaction(null);
                setComment('');
                onReviewSubmitted?.();
                onClose(); // 저장 성공 시 모달 닫기
                loadExistingReviews(); // 목록 새로고침
            }
        } catch (err: any) {
            console.error('Critical exception during review submit:', err);
            toast.error(`시스템 오류: ${err.message || '알 수 없는 예외 발생'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSatisfactionLabel = (level?: SatisfactionLevel) => {
        switch (level) {
            case 'SATISFIED': return '만족';
            case 'NORMAL': return '보통';
            case 'DISSATISFIED': return '불만';
            default: return '';
        }
    };

    const getSatisfactionColor = (level?: SatisfactionLevel) => {
        switch (level) {
            case 'SATISFIED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'NORMAL': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'DISSATISFIED': return 'text-rose-600 bg-rose-50 border-rose-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
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
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {/* 이미 평가함 알림 */}
                    {alreadyReviewed && (
                        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                            <AlertCircle className="text-amber-500 mt-0.5" size={18} />
                            <div>
                                <p className="text-sm font-bold text-amber-900">이미 평가를 작성한 인플루언서입니다.</p>
                                <p className="text-xs text-amber-700 mt-0.5">이 캠페인에 대해서는 중복 평가가 불가능합니다. 아래 히스토리에서 내용을 확인하세요.</p>
                            </div>
                        </div>
                    )}

                    {/* 만족도 선택 */}
                    <div className={`mb-8 ${alreadyReviewed ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            전반적인 만족도 <span className="text-rose-500">*</span>
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {(['SATISFIED', 'NORMAL', 'DISSATISFIED'] as SatisfactionLevel[]).map((level) => {
                                const isSelected = satisfaction === level;
                                const label = getSatisfactionLabel(level);
                                const baseStyle = "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 font-bold text-sm";
                                
                                let colorStyle = "";
                                if (level === 'SATISFIED') colorStyle = isSelected ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500";
                                if (level === 'NORMAL') colorStyle = isSelected ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100" : "bg-white border-gray-100 text-gray-400 hover:border-amber-200 hover:text-amber-500";
                                if (level === 'DISSATISFIED') colorStyle = isSelected ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100" : "bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-500";

                                return (
                                    <button
                                        key={level}
                                        onClick={() => setSatisfaction(level)}
                                        className={`${baseStyle} ${colorStyle}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-gray-50'}`}>
                                            {level === 'SATISFIED' && '😊'}
                                            {level === 'NORMAL' && '😐'}
                                            {level === 'DISSATISFIED' && '😡'}
                                        </div>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 평가 태그 선택 */}
                    <div className={`mb-6 ${alreadyReviewed ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">상세 평가 피드백</h3>
                        <div className="space-y-4">
                            {/* 긍정 태그 */}
                            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                <div className="text-[11px] font-black text-emerald-600 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    긍정적인 부분
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {RATING_TAGS.filter(t => t.type === 'positive').map(tag => (
                                        <button
                                            key={tag.label}
                                            onClick={() => handleTagToggle(tag.label)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.label)
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* 주의 태그 */}
                                <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                                    <div className="text-[11px] font-black text-amber-600 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        주의가 필요해요
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {RATING_TAGS.filter(t => t.type === 'warning').map(tag => (
                                            <button
                                                key={tag.label}
                                                onClick={() => handleTagToggle(tag.label)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.label)
                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                        : 'bg-white text-amber-700 border border-amber-100 hover:bg-amber-50'
                                                    }`}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 부정 태그 */}
                                <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50">
                                    <div className="text-[11px] font-black text-rose-600 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        문제가 있었어요
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {RATING_TAGS.filter(t => t.type === 'negative').map(tag => (
                                            <button
                                                key={tag.label}
                                                onClick={() => handleTagToggle(tag.label)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.label)
                                                        ? 'bg-rose-600 text-white shadow-sm'
                                                        : 'bg-white text-rose-700 border border-rose-100 hover:bg-rose-50'
                                                    }`}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 상세 메모 */}
                    <div className={`mb-8 ${alreadyReviewed ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <MessageSquare size={16} className="text-gray-400" />
                            상세 메모 (관리자 참조용)
                        </h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="평가에 대한 자세한 사유나 메모를 남겨주세요."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm resize-none"
                            rows={3}
                        />
                    </div>

                    {/* 기존 평가 내역 - 아코디언 스타일 */}
                    {existingReviews.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                            <button 
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                className="w-full flex items-center justify-between py-2 group"
                            >
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-gray-900">이전 평가 히스토리</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{existingReviews.length}건</span>
                                </div>
                                {isHistoryOpen ? <ChevronUp className="text-gray-400 group-hover:text-gray-600" size={20} /> : <ChevronDown className="text-gray-400 group-hover:text-gray-600" size={20} />}
                            </button>
                            
                            {isHistoryOpen && (
                                <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in duration-300">
                                    {existingReviews.map(review => (
                                        <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getSatisfactionColor(review.satisfaction)}`}>
                                                        {getSatisfactionLabel(review.satisfaction || 'NORMAL')}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">
                                                            {review.reviewer?.nickname || '운영자'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                            {review.campaign && ` · ${review.campaign.title}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <InfluencerReviewTags tags={review.rating_tags} />
                                            {review.comment && (
                                                <div className="mt-3 p-3 bg-gray-50/50 rounded-xl text-xs text-gray-600 leading-relaxed font-medium">
                                                    {review.comment}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <p className="text-sm text-gray-500">
                        {alreadyReviewed ? (
                            <span className="text-rose-500 font-bold italic">평가 완료된 캠페인</span>
                        ) : (
                            <>선택된 태그: <span className="font-bold text-gray-900">{selectedTags.length}개</span></>
                        )}
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
                            disabled={isSubmitting || selectedTags.length === 0 || alreadyReviewed}
                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '저장 중...' : alreadyReviewed ? '평가 완료' : '평가 저장'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
