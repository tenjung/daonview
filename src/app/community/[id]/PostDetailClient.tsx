"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { User, MessageSquare, Send, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PostDetailLayout from "@/components/community/PostDetailLayout";

interface PostDetailClientProps {
    initialPost: any;
    initialComments: any[];
    id: string;
}

function formatStableDate(input: string): string {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '-';
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${year}. ${month}. ${day}.`;
}

export default function PostDetailClient({ initialPost, initialComments, id }: PostDetailClientProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [comments, setComments] = useState<any[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [commentType, setCommentType] = useState<'FEEDBACK' | 'NETWORK'>('FEEDBACK');
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        incrementViewCount();
    }, []);

    const incrementViewCount = async () => {
        try {
            await supabase.rpc('increment_view_count', { post_id: id });
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    };

    const fetchComments = async () => {
        try {
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', id)
                .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;
            if (!commentsData || commentsData.length === 0) {
                setComments([]);
                return;
            }

            const userIds = Array.from(new Set(commentsData.map(c => c.user_id)));
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, nickname, name')
                .in('id', userIds);

            const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
                acc[p.id] = p;
                return acc;
            }, {});

            const combinedComments = commentsData.map(c => ({
                ...c,
                profiles: profilesMap[c.user_id] || null
            }));

            setComments(combinedComments);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const parseCommentKind = (text: string): 'AI_ANALYSIS' | 'NETWORK' | 'FEEDBACK' => {
        if (text.startsWith('[AI_ANALYSIS]')) return 'AI_ANALYSIS';
        if (text.startsWith('[NETWORK]')) return 'NETWORK';
        if (text.startsWith('[FEEDBACK]')) return 'FEEDBACK';
        return 'FEEDBACK';
    };

    const stripCommentPrefix = (text: string) =>
        text
            .replace(/^\[(AI_ANALYSIS|NETWORK|FEEDBACK)\]\s*/i, '')
            .trim();

    const handleWriteComment = async () => {
        if (!user) {
            toast.error("로그인이 필요합니다.");
            return;
        }
        if (!newComment.trim()) return;

        const normalizedContent =
            initialPost.type === 'FREE'
                ? `[${commentType}] ${newComment.trim()}`
                : newComment.trim();

        try {
            setCommentLoading(true);
            const { error } = await supabase
                .from('comments')
                .insert({
                    post_id: id,
                    user_id: user.id,
                    content: normalizedContent
                });

            if (error) throw error;

            setNewComment("");
            fetchComments();
            toast.success("댓글이 등록되었습니다.");
        } catch (error) {
            console.error('Error writing comment:', error);
            toast.error("댓글 등록 중 오류가 발생했습니다.");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm("정말로 삭제하시겠습니까?")) return;

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success("게시글이 삭제되었습니다.");
            router.back();
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            fetchComments();
            toast.success("댓글이 삭제되었습니다.");
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const isOwner = user && user.id === initialPost.user_id;

    const getBackLink = () => {
        switch (initialPost.type) {
            case 'FREE': return '/community/feedback';
            case 'BLOG_INTRO': return '/community/blog-intro';
            default: return '/community';
        }
    };

    const getPostTypeLabel = () => {
        switch (initialPost.type) {
            case 'FREE': return '포스팅 피드백';
            case 'BLOG_INTRO': return '내 블로그 소개';
            default: return initialPost.type;
        }
    };

    return (
        <PostDetailLayout
            backLink={getBackLink()}
            typeLabel={getPostTypeLabel()}
            isPinned={initialPost.is_pinned}
            title={initialPost.title}
            author={initialPost.profiles?.nickname || initialPost.profiles?.name || '익명'}
            createdAt={formatStableDate(initialPost.created_at)}
            viewCount={initialPost.view_count || 0}
            extraHeader={isOwner && (
                <div className="flex gap-1 shrink-0">
                    <Link href={`/community/write?edit=${id}`} className="p-1.5 text-gray-300 hover:text-primary transition-colors">
                        <Edit2 size={15} />
                    </Link>
                    <button onClick={handleDeletePost} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                    </button>
                </div>
            )}
        >
            {/* Content Body */}
            <div
                className="prose prose-xs md:prose-sm max-w-none prose-slate prose-img:rounded-lg leading-relaxed mb-10"
                dangerouslySetInnerHTML={{ __html: initialPost.content }}
            />

            {/* Comments Section */}
            <div className="space-y-8 pt-8 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" />
                    <h2 className="text-xl font-bold">댓글 <span className="text-primary">{comments.length}</span></h2>
                </div>

                {/* Comment Input */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    {initialPost.type === 'FREE' && (
                        <div className="mb-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCommentType('FEEDBACK')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${commentType === 'FEEDBACK'
                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                피드백
                            </button>
                            <button
                                type="button"
                                onClick={() => setCommentType('NETWORK')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${commentType === 'NETWORK'
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                이웃·맞팔
                            </button>
                        </div>
                    )}
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={
                            user
                                ? (initialPost.type === 'FREE'
                                    ? (commentType === 'NETWORK'
                                        ? "SNS 링크와 함께 이웃추가/맞팔 제안을 남겨보세요."
                                        : "포스팅 개선 피드백을 남겨보세요.")
                                    : "댓글을 입력해보세요...")
                                : "로그인 후 댓글을 작성할 수 있습니다."
                        }
                        className="w-full bg-transparent border-none focus:ring-0 resize-none px-4 py-2 text-sm"
                        rows={3}
                        disabled={!user || commentLoading}
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleWriteComment}
                            disabled={!user || !newComment.trim() || commentLoading}
                            className="btn btn-primary h-10 px-6 rounded-xl font-bold text-sm gap-2"
                        >
                            {commentLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            등록하기
                        </button>
                    </div>
                </div>

                {/* Comment List */}
                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            {initialPost.type === 'FREE'
                                ? '첫 피드백을 남겨보세요!'
                                : '첫 번째 댓글을 남겨보세요!'}
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 group">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <User size={20} className="text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 text-sm">
                                                {comment.profiles?.nickname || comment.profiles?.name || '익명'}
                                            </span>
                                            {initialPost.type === 'FREE' && (() => {
                                                const kind = parseCommentKind(comment.content || '');
                                                if (kind === 'AI_ANALYSIS') {
                                                    return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-100">AI 분석</span>;
                                                }
                                                if (kind === 'NETWORK') {
                                                    return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">이웃·맞팔</span>;
                                                }
                                                return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100">피드백</span>;
                                            })()}
                                            <span className="text-[10px] text-gray-400">
                                                {formatStableDate(comment.created_at)}
                                            </span>
                                        </div>
                                        {user && user.id === comment.user_id && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {stripCommentPrefix(comment.content || '')}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PostDetailLayout>
    );
}
