'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
    X, 
    AlertCircle, 
    ThumbsUp, 
    ThumbsDown, 
    MessageSquare, 
    Clock, 
    History,
    Calendar,
    Megaphone,
    Star,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { SatisfactionLevel, InfluencerReview } from '@/types/review';
import InfluencerReviewTags from './InfluencerReviewTags';

interface ReputationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    influencerId: string;
    influencerName: string;
}

interface CancelHistory {
    id: number;
    campaign_title: string;
    cancelled_at: string;
    cancellation_reason: string;
}

export default function ReputationDetailModal({
    isOpen,
    onClose,
    influencerId,
    influencerName
}: ReputationDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState<InfluencerReview[]>([]);
    const [cancellations, setCancellations] = useState<CancelHistory[]>([]);
    const [isCancelHistoryOpen, setIsCancelHistoryOpen] = useState(false);

    useEffect(() => {
        if (isOpen && influencerId) {
            fetchReputationData();
        }
    }, [isOpen, influencerId]);

    const fetchReputationData = async () => {
        setLoading(true);
        try {
            // 1. 리뷰 이력 가져오기
            const { data: reviewsData } = await supabase
                .from('influencer_reviews')
                .select(`
                    id,
                    satisfaction,
                    rating_tags,
                    comment,
                    created_at,
                    reviewer:profiles!influencer_reviews_reviewer_id_fkey (nickname, company_name),
                    campaign:campaigns (id, title)
                `)
                .eq('influencer_id', influencerId)
                .order('created_at', { ascending: false });

            // 2. 취소 이력 가져오기
            const { data: cancelData } = await supabase
                .from('applications')
                .select(`
                    id,
                    cancelled_at,
                    cancellation_reason,
                    campaigns (title)
                `)
                .eq('user_id', influencerId)
                .eq('status', 'CANCELLED')
                .order('cancelled_at', { ascending: false });

            setReviews((reviewsData as any[] || []).map(r => ({
                ...r,
                reviewer: Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer,
                campaign: Array.isArray(r.campaign) ? r.campaign[0] : r.campaign
            })));
            
            const formattedCancels = (cancelData || []).map((c: any) => ({
                id: c.id,
                campaign_title: c.campaigns?.title || '알 수 없는 캠페인',
                cancelled_at: c.cancelled_at,
                cancellation_reason: c.cancellation_reason || '사유 미입력'
            }));
            
            setCancellations(formattedCancels);
        } catch (error) {
            console.error('Error fetching reputation details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSatisfactionEmoji = (level: string) => {
        switch (level.toUpperCase()) {
            case 'SATISFIED': return { emoji: '😊', label: '만족', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' };
            case 'NORMAL': return { emoji: '😐', label: '보통', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' };
            case 'DISSATISFIED': return { emoji: '😡', label: '불만', color: 'bg-rose-50 text-rose-600', border: 'border-rose-100' };
            default: return { emoji: '❓', label: '미정', color: 'bg-gray-50 text-gray-600', border: 'border-gray-100' };
        }
    };

    const categorizeTags = (tags: string[]) => {
        const positive = tags.filter(t => ['리뷰가 빨라요', '사진이 이뻐요', '소통이 원활해요', '성실해요', '퀄리티가 좋아요'].includes(t));
        const warning = tags.filter(t => ['리뷰등록이 느려요', '리뷰지연발생', '소통이 느려요'].includes(t));
        const problem = tags.filter(t => ['연락두절 발생', '약속 미이행', '리뷰 미작성'].includes(t));
        return { positive, warning, problem };
    };

    if (!isOpen) return null;

    const satisfactionStats = {
        satisfied: reviews.filter(r => r.satisfaction?.toUpperCase() === 'SATISFIED').length,
        normal: reviews.filter(r => r.satisfaction?.toUpperCase() === 'NORMAL').length,
        dissatisfied: reviews.filter(r => r.satisfaction?.toUpperCase() === 'DISSATISFIED').length,
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Star className="text-amber-400 w-6 h-6 fill-amber-400" />
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">인플루언서 평판</h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-bold">{influencerName}님에 대한 평판 정보를 확인하세요</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 scrollbar-hide">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin" />
                            <p className="text-gray-400 font-bold">평판 데이터를 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* Satisfaction Summary Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Star size={18} className="text-amber-500 fill-amber-500" />
                                    <h3 className="text-lg font-black text-gray-900">전반적인 만족도</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { level: 'SATISFIED', count: satisfactionStats.satisfied },
                                        { level: 'NORMAL', count: satisfactionStats.normal },
                                        { level: 'DISSATISFIED', count: satisfactionStats.dissatisfied }
                                    ].map((item) => {
                                        const config = getSatisfactionEmoji(item.level);
                                        return (
                                            <div key={item.level} className={`rounded-3xl border-2 py-3 flex flex-col items-center gap-1.5 transition-all ${item.count > 0 ? config.border + ' ' + config.color : 'border-gray-50 bg-gray-50 text-gray-300 opacity-50'}`}>
                                                <span className="text-2xl">{config.emoji}</span>
                                                <div className="text-center">
                                                    <p className="text-xs font-black">{config.label}</p>
                                                    <p className="text-[10px] font-bold mt-0.5">{item.count}건</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Detailed Feedback History */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare size={18} className="text-primary" />
                                    <h3 className="text-lg font-black text-gray-900">상세 평가 피드백</h3>
                                </div>
                                {reviews.length === 0 ? (
                                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-dashed border-gray-200 text-center text-gray-400 font-bold text-sm">
                                        등록된 상세 평가가 없습니다.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {reviews.map((review) => {
                                            const { positive, warning, problem } = categorizeTags(review.rating_tags || []);
                                            return (
                                                <div key={review.id} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-xl">{getSatisfactionEmoji(review.satisfaction || '').emoji}</div>
                                                            <div>
                                                                <p className="text-xs font-black text-gray-900 leading-tight">{review.campaign?.title}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(review.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5">
                                                        {positive.map(tag => <span key={tag} className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">● {tag}</span>)}
                                                        {warning.map(tag => <span key={tag} className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100">● {tag}</span>)}
                                                        {problem.map(tag => <span key={tag} className="px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black border border-rose-100">● {tag}</span>)}
                                                    </div>
                                                    
                                                    {review.comment && (
                                                        <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                                                            <p className="text-xs text-gray-600 font-bold leading-relaxed">{review.comment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* Cancellation History Section - Accordion Style */}
                            <section className="pt-4 border-t border-gray-50">
                                <button 
                                    onClick={() => setIsCancelHistoryOpen(!isCancelHistoryOpen)}
                                    className="w-full flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2">
                                        <History size={18} className="text-rose-500" />
                                        <h3 className="text-lg font-black text-gray-900">선정 후 취소 이력</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full">{cancellations.length}건</span>
                                    </div>
                                    {isCancelHistoryOpen ? <ChevronUp className="text-gray-400" size={20} /> : <ChevronDown className="text-gray-400" size={20} />}
                                </button>
                                
                                {isCancelHistoryOpen && (
                                    <div className="mt-4 space-y-3 animate-in fade-in duration-300">
                                        {cancellations.length === 0 ? (
                                            <div className="bg-gray-50/50 rounded-3xl p-8 border border-dashed border-gray-200 text-center text-gray-400 font-bold text-sm">
                                                취소 이력이 없습니다. 정직하게 활동 중입니다. ✨
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {cancellations.map((cancel) => (
                                                    <div key={cancel.id} className="bg-rose-50/40 rounded-3xl p-5 border border-rose-100/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-black text-gray-800">{cancel.campaign_title}</p>
                                                            <span className="text-[10px] font-bold text-rose-400">{new Date(cancel.cancelled_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-xs text-rose-600 font-bold">
                                                            <span className="text-[10px] uppercase text-rose-300 mr-2">사유:</span>
                                                            {cancel.cancellation_reason}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
