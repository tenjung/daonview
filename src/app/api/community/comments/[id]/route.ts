import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'UNKNOWN_ERROR';
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id: commentId } = await params;
    if (!commentId) {
      return NextResponse.json({ error: 'commentId가 필요합니다.', code: 'INVALID_COMMENT_ID' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: comment, error: commentError } = await admin
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.', code: 'COMMENT_NOT_FOUND' }, { status: 404 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const normalizedRole = String(profile?.role || '').toUpperCase();
    const isOwner = comment.user_id === user.id;
    const isAdmin = normalizedRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.', code: 'FORBIDDEN' }, { status: 403 });
    }

    const { error: deleteError } = await admin.from('comments').delete().eq('id', commentId);

    if (deleteError) {
      return NextResponse.json(
        {
          error: '댓글 삭제 중 오류가 발생했습니다.',
          code: deleteError.code || 'COMMENT_DELETE_FAILED',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: '댓글 삭제 중 오류가 발생했습니다.',
        code: 'COMMENT_DELETE_EXCEPTION',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
