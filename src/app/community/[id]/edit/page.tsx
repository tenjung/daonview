import { createClient as createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import PostEditForm from '@/components/community/PostEditForm';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PostEditPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createServerClient();

    // 1. 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/community/' + id);
    }

    // 2. 게시글 조회
    const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

    if (postError || !post) {
        return notFound();
    }

    // 3. 권한 확인 (작성자 또는 관리자)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAuthor = post.user_id === user.id;
    const isAdmin = profile?.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
        redirect('/community/' + id);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">게시글 수정</h1>

                    <PostEditForm
                        postId={post.id}
                        initialTitle={post.title}
                        initialContent={post.content}
                        postType={post.type}
                    />
                </div>
            </div>
        </div>
    );
}
