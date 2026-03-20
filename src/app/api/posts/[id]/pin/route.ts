import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts/[id]/pin
 * 게시글 고정/해제 (관리자만)
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // 1. 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        // 2. 관리자 권한 확인
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '관리자 권한이 필요합니다.' },
                { status: 403 }
            );
        }

        // 3. 요청 데이터 파싱
        const body = await request.json();
        const { is_pinned } = body;

        if (typeof is_pinned !== 'boolean') {
            return NextResponse.json(
                { error: 'is_pinned 값이 유효하지 않습니다.' },
                { status: 400 }
            );
        }

        // 4. 게시글 고정/해제
        const { data: updatedPost, error: updateError } = await supabase
            .from('posts')
            .update({ is_pinned })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            message: is_pinned ? '게시글이 고정되었습니다.' : '게시글 고정이 해제되었습니다.',
            is_pinned,
            post: updatedPost,
        });

    } catch (error: any) {
        console.error('[Post Pin Error]:', error);
        return NextResponse.json(
            { error: '게시글 고정 처리 중 오류가 발생했습니다.', details: error.message },
            { status: 500 }
        );
    }
}
