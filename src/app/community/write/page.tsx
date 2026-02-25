"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, FileText, AlertCircle } from "lucide-react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { supabase } from "@/lib/supabase/client";
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
    'FREE': '/community/feedback',
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
    'FREE': '포스팅 피드백',
    'BLOG_INTRO': '내 블로그 소개',
    'ACADEMY_ADVERTISER': '광고주 칼럼',
    'ACADEMY_INFLUENCER': '인플루언서 칼럼'
};

function stripHtmlTags(input: string): string {
    return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildAutoAiFeedback(title: string, contentHtml: string): string {
    const plainContent = stripHtmlTags(contentHtml);
    const hasExternalLink = /(https?:\/\/|blog\.naver\.com|instagram\.com|youtube\.com|tiktok\.com)/i.test(contentHtml);
    const contentLength = plainContent.length;

    const headlineFeedback =
        title.length >= 14
            ? '제목에 핵심 키워드가 잘 들어가 있어 검색 노출에 유리합니다.'
            : '제목이 짧은 편입니다. 핵심 키워드를 1~2개 더 넣어보세요.';

    const bodyFeedback =
        contentLength >= 220
            ? '본문 정보량이 충분해서 체류시간 측면에서 강점이 있습니다.'
            : '본문 정보량이 부족합니다. 사용감/비교 포인트를 3문장 이상 추가해보세요.';

    const linkFeedback = hasExternalLink
        ? '링크가 포함되어 있어 유입 동선이 준비되어 있습니다.'
        : '링크가 없어 전환 동선이 약합니다. 본문 하단에 관련 링크를 추가하세요.';

    return [
        '[AI_ANALYSIS]',
        '🤖 AI 포스팅 분석 (자동 생성)',
        '',
        '1) 강점',
        `- ${headlineFeedback}`,
        `- ${bodyFeedback}`,
        '',
        '2) 개선 제안',
        `- ${linkFeedback}`,
        '- 첫 문단 2줄 안에 “누가/왜/무엇”을 명확히 써주세요.',
        '- 마지막 문단에 저장/댓글 유도 CTA를 1문장 추가하세요.',
    ].join('\n');
}

async function generateAiFeedbackComment(title: string, contentHtml: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch('/api/community/feedback-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content: contentHtml }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return buildAutoAiFeedback(title, contentHtml);
        }

        const data = await response.json();
        const comment = typeof data?.comment === 'string' ? data.comment.trim() : '';
        return comment || buildAutoAiFeedback(title, contentHtml);
    } catch {
        return buildAutoAiFeedback(title, contentHtml);
    }
}

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
                const updateData: any = {
                    title: title,
                    content: content,
                };

                // 'posts' 테이블에만 updated_at 컬럼이 있음
                if (!isNoticeTable) {
                    updateData.updated_at = new Date().toISOString();
                }

                const { error } = await supabase
                    .from(tableName)
                    .update(updateData)
                    .eq('id', editId);

                if (error) throw error;
                toast.success("글이 수정되었습니다.");
            } else {
                // 신규 작성
                if (isNoticeTable) {
                    // notices 테이블에 저장 (공지, 이벤트)
                    const { data: insertedNotice, error } = await supabase.from('notices').insert({
                        type: dbType,
                        title,
                        content,
                        author_id: user.id,
                        is_pinned: false,
                        view_count: 0
                    }).select().single();

                    if (error) throw error;

                    // 공지사항 알림 전파 (NOTICE 타입일 때만)
                    if (dbType === '공지' && insertedNotice) {
                        // 모든 프로필 ID 조회
                        const { data: usersData } = await supabase
                            .from('profiles')
                            .select('id');

                        if (usersData && usersData.length > 0) {
                            const notifications = usersData.map(u => ({
                                user_id: u.id,
                                type: 'NOTICE',
                                title: '📢 전사 공지사항 안내',
                                content: `[공지] ${title}`,
                                link: `/community/notice/${insertedNotice.id}`
                            }));

                            // 대량 인서트 (배치 처리)
                            await supabase.from('notifications').insert(notifications);
                        }
                    }
                } else {
                    // posts 테이블에 저장 (자유게시판, 블로그, 아카데미)
                    const { data: insertedPost, error } = await supabase.from('posts').insert({
                        user_id: user.id,
                        type: dbType,
                        title,
                        content,
                        view_count: 0
                    }).select('id').single();

                    if (error) throw error;

                    // 포스팅 피드백(FREE) 등록 시 AI 분석 코멘트 자동 생성
                    if (type === 'FREE' && insertedPost?.id) {
                        const autoCommentTask = (async () => {
                            const aiFeedback = await generateAiFeedbackComment(title, content);
                            const { error: commentError } = await supabase
                                .from('comments')
                                .insert({
                                    post_id: insertedPost.id,
                                    user_id: user.id,
                                    content: aiFeedback
                                });

                            if (commentError) {
                                console.error('Auto AI feedback comment insert failed:', commentError);
                            }
                        })();

                        await Promise.race([
                            autoCommentTask,
                            new Promise<void>((resolve) =>
                                setTimeout(() => {
                                    console.warn('Auto AI feedback timed out. Continue without blocking save flow.');
                                    resolve();
                                }, 4000)
                            ),
                        ]);
                    }
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
            // 에러 객체의 상세 내용을 토스트에 표시
            const errorMessage = error.message || error.error_description || JSON.stringify(error);
            toast.error("글 저장 중 오류가 발생했습니다: " + errorMessage);
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

                {type === 'FREE' && (
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                        <p className="font-bold mb-1">포스팅 피드백 작성 가이드</p>
                        <p className="text-sky-800/90 leading-relaxed">
                            제목에 플랫폼/주제를 포함하고, 본문에 포스팅 링크와 피드백 받고 싶은 포인트를 적어주세요.
                            등록 후 AI 분석 코멘트가 자동으로 생성됩니다.
                        </p>
                    </div>
                )}
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
