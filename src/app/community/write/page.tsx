"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function WritePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeFromQuery = searchParams.get('type') || 'FREE';
    const editId = searchParams.get('edit');

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState(typeFromQuery);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            await checkUser();
            if (editId) {
                await fetchPostForEdit();
            } else {
                setInitialLoading(false);
            }
        };
        init();
    }, [editId]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("로그인이 필요한 서비스입니다.");
            router.push("/login?returnUrl=/community/write");
            return;
        }
        setUser(user);
    };

    const fetchPostForEdit = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', editId)
                .single();

            if (error) throw error;
            setTitle(data.title);
            setContent(data.content);
            setType(data.type);
        } catch (error) {
            console.error('Error fetching post for edit:', error);
            toast.error("게시글을 불러올 수 없습니다.");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            toast.error("사용자 인증 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }
        if (!title.trim()) {
            toast.error("제목을 입력해주세요.");
            return;
        }
        if (!content.trim() || content === '<p></p>') {
            toast.error("내용을 입력해주세요.");
            return;
        }

        try {
            setLoading(true);

            if (editId) {
                // Update existing post
                const { error } = await supabase
                    .from('posts')
                    .update({
                        title: title,
                        content: content,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editId);

                if (error) throw error;
                toast.success("글이 수정되었습니다.");
            } else {
                // Insert new post
                const { error } = await supabase
                    .from('posts')
                    .insert({
                        user_id: user.id,
                        type: type,
                        title: title,
                        content: content,
                        view_count: 0
                    });

                if (error) throw error;
                toast.success("글이 성공적으로 등록되었습니다.");
            }

            router.push(`/community/${type.toLowerCase() === 'free' ? 'free' : type.toLowerCase()}`);
        } catch (error: any) {
            console.error('Error saving post:', error);
            toast.error("글 저장 중 오류가 발생했습니다: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-400">데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl space-y-8 min-h-screen pb-20">
            <div className="mb-4">
                <Link
                    href={`/community/${type.toLowerCase() === 'free' ? 'free' : type.toLowerCase()}`}
                    className="inline-flex items-center text-gray-500 hover:text-primary mb-4 transition-colors font-medium"
                >
                    <ArrowLeft size={20} className="mr-1" />
                    돌아가기
                </Link>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-text-main">
                        {editId ? '글 수정하기' : (
                            type === 'FREE' ? '자유게시판' :
                                type === 'NOTICE' ? '공지사항' :
                                    type === 'EVENT' ? '이벤트' : '새 글 작성'
                        )}
                    </h1>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="w-full text-3xl font-black border-none py-4 px-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-200 transition-colors text-gray-800"
                />

                <div className="min-h-[500px]">
                    <TiptapEditor initialContent={content} onChange={setContent} />
                </div>
            </div>

            <div className="flex justify-end gap-3 fixed bottom-8 right-8 z-20">
                <button
                    onClick={() => router.back()}
                    className="btn bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-md px-8 h-14 rounded-2xl font-bold"
                    disabled={loading}
                >
                    취소
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn btn-primary shadow-xl shadow-indigo-500/20 px-8 h-14 rounded-2xl font-bold gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {editId ? '수정 완료' : '등록하기'}
                </button>
            </div>
        </div>
    );
}
