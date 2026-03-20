import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type CommentType = 'FEEDBACK' | 'NETWORK';

function normalizeCommentType(input: unknown): CommentType {
  const normalized = String(input || 'FEEDBACK').toUpperCase();
  return normalized === 'NETWORK' ? 'NETWORK' : 'FEEDBACK';
}

function normalizeContentForPost(postType: string, content: string, commentType: CommentType): string {
  const trimmed = content.trim();
  if (postType.toUpperCase() !== 'FREE') return trimmed;
  return `[${commentType}] ${trimmed}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'UNKNOWN_ERROR';
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const postId = String(body?.postId || '').trim();
    const rawContent = String(body?.content || '').trim();
    const commentType = normalizeCommentType(body?.commentType);

    if (!postId) {
      return NextResponse.json({ error: 'postId가 필요합니다.', code: 'INVALID_POST_ID' }, { status: 400 });
    }

    if (!rawContent) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.', code: 'EMPTY_CONTENT' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: post, error: postError } = await admin
      .from('posts')
      .select('id, type')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.', code: 'POST_NOT_FOUND' }, { status: 404 });
    }

    const normalizedContent = normalizeContentForPost(String(post.type || ''), rawContent, commentType);

    const { data: insertedComment, error: insertError } = await admin
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: normalizedContent,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: '댓글 등록 중 오류가 발생했습니다.',
          code: insertError.code || 'COMMENT_INSERT_FAILED',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, commentId: insertedComment.id });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: '댓글 등록 중 오류가 발생했습니다.',
        code: 'COMMENT_CREATE_EXCEPTION',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
