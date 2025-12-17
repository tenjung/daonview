'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getUserDrafts, deleteDraft, getCampaignTypeLabel, formatDate, DraftCampaign } from '@/lib/draftUtils';
import { toast } from 'sonner';
import AdminSidebar from '@/components/AdminSidebar';
import { Edit, Trash2, Calendar, ChevronRight } from 'lucide-react';

export default function DraftCampaignsPage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<DraftCampaign[]>([]);
    const [userId, setUserId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserAndDrafts();
    }, []);

    const loadUserAndDrafts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            setUserId(user.id);
            setUserId(user.id);
            const userDrafts = await getUserDrafts(user.id);
            setDrafts(userDrafts);
        } catch (error) {
            console.error('사용자 정보 불러오기 실패:', error);
            toast.error('사용자 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (draft: DraftCampaign) => {
        // 임시저장 데이터를 쿼리 파라미터로 전달
        router.push(`/dashboard/campaign/new?draftId=${draft.id}`);
    };

    const handleDelete = async (draftId: string) => {
        if (confirm('이 임시저장을 삭제하시겠습니까?')) {
            try {
                await deleteDraft(userId, draftId);
                await loadUserAndDrafts();
                toast.success('임시저장이 삭제되었습니다.');
            } catch (error) {
                toast.error('삭제에 실패했습니다.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 py-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* 헤더 */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">임시저장 캠페인</h1>
                        <p className="text-gray-600">
                            작성 중이던 캠페인을 이어서 작성하거나 삭제할 수 있습니다. (최대 10개)
                        </p>
                    </div>

                    {/* 임시저장 목록 */}
                    {drafts.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="text-6xl mb-4">📝</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">임시저장된 캠페인이 없습니다</h2>
                            <p className="text-gray-600 mb-6">
                                새로운 캠페인을 작성하고 임시저장해보세요.
                            </p>
                            <button
                                onClick={() => router.push('/dashboard/campaign/new')}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            >
                                새 캠페인 작성하기
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    {/* 헤더 */}
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                                            {getCampaignTypeLabel(draft.campaignType)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(draft.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* 제목 */}
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                        {draft.title || '제목 없음'}
                                    </h3>

                                    {/* 진행 상태 */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                            <span>진행 상태</span>
                                            <span className="font-medium">Step {draft.currentStep}/3</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all"
                                                style={{ width: `${(draft.currentStep / 3) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* 날짜 */}
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                        <Calendar size={14} />
                                        <span>마지막 수정: {formatDate(draft.updatedAt)}</span>
                                    </div>

                                    {/* 작성하러 가기 버튼 */}
                                    <button
                                        onClick={() => handleEdit(draft)}
                                        className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <Edit size={18} />
                                        작성하러 가기
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
