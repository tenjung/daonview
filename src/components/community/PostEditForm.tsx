"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import dynamic from 'next/dynamic';
import { useAuthStore } from "@/store/authStore";

const TiptapEditor = dynamic(() => import('@/components/editor/TiptapEditor'), { ssr: false });

interface PostEditFormProps {
    postId: string;
    initialTitle: string;
    initialContent: string;
    postType: string;
}

export default function PostEditForm({ postId, initialTitle, initialContent, postType }: PostEditFormProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, userId: user.id }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ 게시글이 수정되었습니다.');
                router.push(`/community/${postId}`);
                router.refresh();
            } else {
                alert(`❌ ${data.error || '수정 중 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error('[Update Error]:', error);
            alert('❌ 수정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (confirm('수정을 취소하시겠습니까?\n변경사항이 저장되지 않습니다.')) {
            router.push(`/community/${postId}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 입력 */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    maxLength={100}
                />
            </div>

            {/* 내용 입력 */}
            <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    내용
                </label>
                <TiptapEditor
                    initialContent={content}
                    onChange={setContent}
                />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {isSubmitting ? '수정 중...' : '수정 완료'}
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                    <X size={20} />
                    취소
                </button>
            </div>
        </form>
    );
}
