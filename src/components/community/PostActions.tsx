"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Pin, PinOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface PostActionsProps {
    postId: string;
    postUserId: string;
    postType: string;
    isPinned: boolean;
}

export default function PostActions({ postId, postUserId, postType, isPinned }: PostActionsProps) {
    const router = useRouter();
    const { user, profile } = useAuthStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPinning, setIsPinning] = useState(false);

    // 권한 체크
    const isAuthor = user?.id === postUserId;
    const isAdmin = profile?.role === 'ADMIN';
    const canEdit = isAuthor || isAdmin;
    const canDelete = isAuthor || isAdmin;
    const canPin = isAdmin;

    // 권한이 없으면 아무것도 표시하지 않음
    if (!canEdit && !canDelete && !canPin) {
        return null;
    }

    // 수정 핸들러
    const handleEdit = () => {
        router.push(`/community/${postId}/edit`);
    };

    // 삭제 핸들러
    const handleDelete = async () => {
        if (!confirm('정말 삭제하시겠습니까?\n삭제된 게시글은 복구할 수 없습니다.')) {
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/posts/${postId}?userId=${user?.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ 게시글이 삭제되었습니다.');

                // 게시글 타입에 따라 리다이렉트
                const redirectMap: Record<string, string> = {
                    'ACADEMY_INFLUENCER': '/community/academy/influencer',
                    'ACADEMY_ADVERTISER': '/community/academy/advertiser',
                    'FREE': '/community/feedback',
                    'QNA': '/community/qna',
                };

                router.push(redirectMap[data.type] || '/community');
            } else {
                alert(`❌ ${data.error || '삭제 중 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error('[Delete Error]:', error);
            alert('❌ 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    // 고정 핸들러
    const handlePin = async () => {
        setIsPinning(true);

        try {
            const response = await fetch(`/api/posts/${postId}/pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_pinned: !isPinned }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${data.message}`);
                router.refresh();
            } else {
                alert(`❌ ${data.error || '고정 처리 중 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error('[Pin Error]:', error);
            alert('❌ 고정 처리 중 오류가 발생했습니다.');
        } finally {
            setIsPinning(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {/* 수정 버튼 */}
            {canEdit && (
                <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                >
                    <Edit size={14} />
                    수정
                </button>
            )}

            {/* 삭제 버튼 */}
            {canDelete && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={14} />
                    {isDeleting ? '삭제 중...' : '삭제'}
                </button>
            )}

            {/* 고정 버튼 (관리자만) */}
            {canPin && (
                <button
                    onClick={handlePin}
                    disabled={isPinning}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isPinned
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                    {isPinning ? '처리 중...' : isPinned ? '고정 해제' : '고정'}
                </button>
            )}
        </div>
    );
}
