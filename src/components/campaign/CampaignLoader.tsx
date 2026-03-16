'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, Trash2, Edit, Calendar } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { getUserDrafts, deleteDraft, getCampaignTypeLabel, formatDate, DraftCampaign } from '@/lib/draftUtils';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CampaignLoaderProps {
    userId: string;
    onLoadDraft: (draft: DraftCampaign) => void;
    onLoadCompleted: (campaign: any) => void;
    onCopyCampaign: (campaign: any) => void;
}

export default function CampaignLoader({ userId, onLoadDraft, onLoadCompleted, onCopyCampaign }: CampaignLoaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'draft' | 'completed'>('draft');
    const [drafts, setDrafts] = useState<DraftCampaign[]>([]);
    const [completedCampaigns, setCompletedCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 임시저장 목록 불러오기
    useEffect(() => {
        if (isExpanded && activeTab === 'draft') {
            loadDrafts();
        }
    }, [isExpanded, activeTab, userId]);

    // 완료된 캠페인 목록 불러오기
    useEffect(() => {
        if (isExpanded && activeTab === 'completed') {
            loadCompletedCampaigns();
        }
    }, [isExpanded, activeTab, userId]);

    const loadDrafts = async () => {
        try {
            const userDrafts = await getUserDrafts(userId);
            setDrafts(userDrafts);
        } catch (error) {
            console.error('임시저장 목록 로딩 실패:', error);
        }
    };

    const loadCompletedCampaigns = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('created_by', userId)
                .order('created_at', { ascending: false })
                .limit(25);

            if (error) throw error;
            setCompletedCampaigns(data || []);
        } catch (error) {
            console.error('완료된 캠페인 불러오기 실패:', error);
            toast.error('캠페인 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDraft = async (draftId: string) => {
        if (confirm('이 임시저장을 삭제하시겠습니까?')) {
            try {
                await deleteDraft(userId, draftId);
                await loadDrafts();
                toast.success('임시저장이 삭제되었습니다.');
            } catch (error) {
                toast.error('삭제에 실패했습니다.');
            }
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            {/* 헤더 */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
            >
                <div className="flex items-center gap-3">
                    <Download size={24} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">캠페인 불러오기</h2>
                    <HelpTooltip content="임시저장은 최대 10개까지 저장됩니다. 10개를 초과하면 가장 오래된 항목이 자동으로 삭제됩니다." />
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {/* 내용 */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                    {/* 탭 */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('draft')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'draft'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            임시저장 캠페인 ({drafts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'completed'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            이전 요청완료 캠페인 ({completedCampaigns.length})
                        </button>
                    </div>

                    {/* 임시저장 목록 */}
                    {activeTab === 'draft' && (
                        <div className="space-y-2">
                            {drafts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>임시저장된 캠페인이 없습니다.</p>
                                </div>
                            ) : (
                                drafts.map((draft) => (
                                    <div
                                        key={draft.id}
                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                                    {getCampaignTypeLabel(draft.campaignType)}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {formatDate(draft.updatedAt)}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{draft.title || '제목 없음'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onLoadDraft(draft)}
                                                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                                            >
                                                <Edit size={14} />
                                                작성하러 가기
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDraft(draft.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* 완료된 캠페인 목록 */}
                    {activeTab === 'completed' && (
                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>불러오는 중...</p>
                                </div>
                            ) : completedCampaigns.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>요청완료된 캠페인이 없습니다.</p>
                                </div>
                            ) : (
                                completedCampaigns.map((campaign) => (
                                    <div
                                        key={campaign.id}
                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    {getCampaignTypeLabel(campaign.campaign_type)}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {formatDate(campaign.created_at)}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{campaign.title}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onCopyCampaign(campaign)}
                                                className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                                복사하기
                                            </button>
                                            <button
                                                onClick={() => onLoadCompleted(campaign)}
                                                className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                                            >
                                                <Download size={14} />
                                                불러오기
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
