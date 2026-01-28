import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Service Role Client (RLS 우회)
const getServiceClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};

/**
 * GET /api/posts/[id]
 * 게시글 상세 조회
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getServiceClient();
        const { id } = await params;

        const { data: post, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (
                    id,
                    nickname,
                    avatar_url
                )
            `)
            .eq('id', id)
            .single();

        if (error || !post) {
            return NextResponse.json(
                { error: '게시글을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ post });
    } catch (error: any) {
        return NextResponse.json(
            { error: '게시글 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/posts/[id]
 * 게시글 수정 (작성자 또는 관리자만)
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getServiceClient();
        const { id } = await params;

        // 1. 요청 데이터 파싱
        const body = await request.json();
        const { title, content, userId } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: '제목과 내용을 입력해주세요.' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        // 2. 게시글 조회
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', id)
            .single();

        if (postError || !post) {
            return NextResponse.json(
                { error: '게시글을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 3. 권한 확인 (작성자 또는 관리자)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        const isAuthor = post.user_id === userId;
        const isAdmin = profile?.role === 'ADMIN';

        if (!isAuthor && !isAdmin) {
            return NextResponse.json(
                { error: '수정 권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 4. 게시글 수정
        const { error: updateError } = await supabase
            .from('posts')
            .update({
                title,
                content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateError) {
            console.error('[Update Error]:', updateError);
            throw updateError;
        }

        // 5. 수정된 게시글 조회
        const { data: updatedPost } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        return NextResponse.json({
            success: true,
            message: '게시글이 수정되었습니다.',
            post: updatedPost,
        });

    } catch (error: any) {
        console.error('[Post Update Error]:', error);
        return NextResponse.json(
            { error: '게시글 수정 중 오류가 발생했습니다.', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/posts/[id]
 * 게시글 삭제 (작성자 또는 관리자만)
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getServiceClient();
        const { id } = await params;

        // 1. 요청 데이터 파싱
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        // 2. 게시글 조회
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('user_id, type')
            .eq('id', id)
            .single();

        if (postError || !post) {
            return NextResponse.json(
                { error: '게시글을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 3. 권한 확인 (작성자 또는 관리자)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        const isAuthor = post.user_id === userId;
        const isAdmin = profile?.role === 'ADMIN';

        if (!isAuthor && !isAdmin) {
            return NextResponse.json(
                { error: '삭제 권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 4. 게시글 삭제
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({
            success: true,
            message: '게시글이 삭제되었습니다.',
            type: post.type,
        });

    } catch (error: any) {
        console.error('[Post Delete Error]:', error);
        return NextResponse.json(
            { error: '게시글 삭제 중 오류가 발생했습니다.', details: error.message },
            { status: 500 }
        );
    }
}
