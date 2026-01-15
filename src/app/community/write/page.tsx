"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, FileText, AlertCircle } from "lucide-react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Type 매핑 정의
const TYPE_MAPPING: Record<string, string> = {
    // notices 테이블 (한글)
    'NOTICE': '공지',
    'EVENT': '이벤트',

    // posts 테이블 (영문)
    'FREE': 'FREE',
    'BLOG_INTRO': 'BLOG_INTRO',
    'ACADEMY_ADVERTISER': 'ACADEMY_ADVERTISER',
    'ACADEMY_INFLUENCER': 'ACADEMY_INFLUENCER'
};

// 리다이렉트 경로 매핑
const REDIRECT_MAP: Record<string, string> = {
    'NOTICE': '/community/notice',
    'EVENT': '/community/event',
    'FREE': '/community/free',
    'BLOG_INTRO': '/community/blog-intro',
    'ACADEMY_ADVERTISER': '/community/academy/advertiser',
    'ACADEMY_INFLUENCER': '/community/academy/influencer'
};

// 관리자 전용 타입
const ADMIN_ONLY_TYPES = [
    'NOTICE',
    'EVENT',
    'ACADEMY_ADVERTISER',
    'ACADEMY_INFLUENCER'
];

// notices 테이블 사용 타입
const NOTICE_TABLE_TYPES = ['NOTICE', 'EVENT'];

// 타입별 제목
const TYPE_TITLES: Record<string, string> = {
    'NOTICE': '공지사항',
    'EVENT': '이벤트',
    'FREE': '자유게시판',
    'BLOG_INTRO': '내 블로그 소개',
    'ACADEMY_ADVERTISER': '광고주 칼럼',
    'ACADEMY_INFLUENCER': '인플루언서 칼럼'
};

function WritePageContent() {
    const { user, profile, isLoading } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeFromQuery = searchParams.get('type') || 'FREE';
    const editId = searchParams.get('edit');

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type] = useState(typeFromQuery);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(false);

    const hasCheckedAuth = useRef(false);
    const isRedirecting = useRef(false);
    const isSubmitting = useRef(false);

    useEffect(() => {
        if (isLoading) return;
        if (hasCheckedAuth.current) return;
        hasCheckedAuth.current = true;

        const init = async () => {
            const userCheckResult = await checkUserAndPermission();
            if (!userCheckResult) return;

            if (editId) {
                await fetchPostForEdit();
            } else {
                // 임시저장 불러오기
                loadDraft();
                setInitialLoading(false);
            }
        };
        init();
    }, [isLoading, user, profile, editId, type]);

    // 내용 변경 감지
    useEffect(() => {
        if (title || content) {
            setIsDirty(true);
            isDirtyRef.current = true;
        }
    }, [title, content]);

    // 브라우저 닫기/새로고침 방지
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirtyRef.current && !isSubmitting.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // 뒤로가기 및 링크 클릭 방지
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    useEffect(() => {
        const handleRouteChange = (e: MouseEvent) => {
            if (isDirty && !isSubmitting.current) {
                const target = e.target as HTMLElement;
                const link = target.closest('a');

                if (link && link.href && !link.href.includes('/community/write')) {
                    e.preventDefault();
                    setPendingNavigation(link.href);
                    setShowExitDialog(true);
                }
            }
        };

        const handlePopState = (e: PopStateEvent) => {
            if (isDirty && !isSubmitting.current) {
                e.preventDefault();
                setPendingNavigation('back');
                setShowExitDialog(true);
                window.history.pushState(null, '', window.location.href);
            }
        };

        // 뒤로가기 방지를 위한 history state 추가
        if (isDirty) {
            window.history.pushState(null, '', window.location.href);
        }

        document.addEventListener('click', handleRouteChange);
        window.addEventListener('popstate', handlePopState);

        return () => {
            document.removeEventListener('click', handleRouteChange);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isDirty, router]);

    const handleConfirmExit = () => {
        // 즉시 ref를 꺼서 브라우저 beforeunload가 트리거되지 않게 함
        isDirtyRef.current = false;
        setIsDirty(false);
        setShowExitDialog(false);

        if (pendingNavigation === 'back') {
            window.history.back();
        } else if (pendingNavigation) {
            window.location.href = pendingNavigation;
        }
    };

    const handleCancelExit = () => {
        setShowExitDialog(false);
        setPendingNavigation(null);
    };

    const checkUserAndPermission = async () => {
        if (!user) {
            if (!isRedirecting.current) {
                isRedirecting.current = true;
                toast.error("로그인이 필요한 서비스입니다.");
                router.push("/login?returnUrl=/community/write");
            }
            return false;
        }

        // 관리자 전용 타입인 경우 권한 확인
        if (ADMIN_ONLY_TYPES.includes(type)) {
            if (profile?.role !== 'ADMIN') {
                if (!isRedirecting.current) {
                    isRedirecting.current = true;
                    toast.error('관리자만 작성할 수 있습니다.');
                    router.push('/community');
                }
                return false;
            }
        }

        return true;
    };

    const fetchPostForEdit = async () => {
        try {
            const isNoticeTable = NOTICE_TABLE_TYPES.includes(type);
            const tableName = isNoticeTable ? 'notices' : 'posts';

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', editId)
                .single();

            if (error) throw error;
            setTitle(data.title);
            setContent(data.content);
        } catch (error) {
            console.error('Error fetching post for edit:', error);
            toast.error("게시글을 불러올 수 없습니다.");
        } finally {
            setInitialLoading(false);
        }
    };

    // 임시저장
    const saveDraft = () => {
        const draft = {
            type,
            title,
            content,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(`draft_${type}`, JSON.stringify(draft));
        toast.success('임시저장되었습니다');
        setIsDirty(false);
    };

    // 임시저장 불러오기
    const loadDraft = () => {
        try {
            const saved = localStorage.getItem(`draft_${type}`);
            if (saved) {
                const draft = JSON.parse(saved);
                setTitle(draft.title || '');
                setContent(draft.content || '');
                const savedDate = new Date(draft.savedAt).toLocaleString('ko-KR');
                toast.info(`임시저장된 글을 불러왔습니다 (${savedDate})`);
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
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

        setLoading(true);
        isSubmitting.current = true;
        try {
            const dbType = TYPE_MAPPING[type];
            const isNoticeTable = NOTICE_TABLE_TYPES.includes(type);

            if (editId) {
                // 수정
                const tableName = isNoticeTable ? 'notices' : 'posts';
                const { error } = await supabase
                    .from(tableName)
                    .update({
                        title: title,
                        content: content,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editId);

                if (error) throw error;
                toast.success("글이 수정되었습니다.");
            } else {
                // 신규 작성
                if (isNoticeTable) {
                    // notices 테이블에 저장 (공지, 이벤트)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('nickname')
                        .eq('id', user.id)
                        .single();

                    const { error } = await supabase.from('notices').insert({
                        type: dbType,
                        title,
                        content,
                        author: profile?.nickname || '관리자',
                        is_pinned: false,
                        view_count: 0
                    });

                    if (error) throw error;
                } else {
                    // posts 테이블에 저장 (자유게시판, 블로그, 아카데미)
                    const { error } = await supabase.from('posts').insert({
                        user_id: user.id,
                        type: dbType,
                        title,
                        content,
                        view_count: 0
                    });

                    if (error) throw error;
                }
                toast.success("글이 성공적으로 등록되었습니다.");
            }

            // 임시저장 삭제
            localStorage.removeItem(`draft_${type}`);
            setIsDirty(false);
            isDirtyRef.current = false;

            router.push(REDIRECT_MAP[type] || '/community');
        } catch (error: any) {
            console.error('Error saving post:', error);
            toast.error("글 저장 중 오류가 발생했습니다: " + error.message);
        } finally {
            setLoading(false);
            isSubmitting.current = false;
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
        <div className="max-w-5xl mx-auto space-y-8 min-h-screen pb-20 px-4 md:px-0">
            <div className="mb-4">
                <Link
                    href={REDIRECT_MAP[type] || '/community'}
                    className="inline-flex items-center text-gray-500 hover:text-primary mb-4 transition-colors font-medium"
                >
                    <ArrowLeft size={20} className="mr-1" />
                    돌아가기
                </Link>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-text-main">
                        {editId ? '글 수정하기' : TYPE_TITLES[type] || '새 글 작성'}
                    </h1>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-visible">
                <div className="px-10 pt-10 pb-0">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setIsDirty(true);
                            isDirtyRef.current = true;
                        }}
                        placeholder="제목을 입력하세요"
                        className="w-full text-3xl md:text-4xl font-black border-none p-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-200 transition-colors text-gray-900 mb-6"
                    />
                </div>

                <div className="relative">
                    <TiptapEditor initialContent={content} onChange={setContent} />
                </div>
            </div>

            <div className="flex justify-end gap-3 fixed bottom-8 right-8 z-20">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="shadow-md px-8 h-12 rounded-xl font-bold border-gray-200"
                    disabled={loading}
                >
                    취소
                </Button>
                <button
                    onClick={saveDraft}
                    disabled={loading || !title.trim()}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg gap-2"
                >
                    <FileText size={18} />
                    임시저장
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            저장 중...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            {editId ? '수정하기' : '등록하기'}
                        </>
                    )}
                </button>
            </div>

            {/* Exit Confirmation Dialog - Shadcn UI Styled */}
            {showExitDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelExit} />
                    <div className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4 text-amber-500">
                            <div className="p-2 bg-amber-50 rounded-full">
                                <AlertCircle size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                페이지를 떠나시겠습니까?
                            </h2>
                        </div>

                        <p className="text-gray-600 mb-8 leading-relaxed">
                            작성 중인 내용이 저장되지 않을 수 있습니다.<br />
                            정말로 현재 페이지에서 나가시겠습니까?
                        </p>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="ghost"
                                onClick={handleCancelExit}
                                className="font-bold text-gray-500 hover:bg-gray-50"
                            >
                                취소
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmExit}
                                className="px-6 font-bold"
                            >
                                나가기
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WritePage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-400">페이지를 준비 중입니다...</p>
            </div>
        }>
            <WritePageContent />
        </Suspense>
    );
}
