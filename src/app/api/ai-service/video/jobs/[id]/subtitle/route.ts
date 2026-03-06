import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthorizedVideoJob, updateVideoJob } from '@/lib/video/db';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
    }

    const { id } = await context.params;
    await getAuthorizedVideoJob(id, user.id);

    const body = await request.json();
    const subtitleFinal = String(body.subtitleFinal || '').trim();

    if (!subtitleFinal) {
      return NextResponse.json({ error: '저장할 자막 내용이 비어 있습니다.' }, { status: 400 });
    }

    const job = await updateVideoJob(id, {
      subtitle_final: subtitleFinal,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('[Video Job Subtitle PATCH] Error:', error);
    const message = error instanceof Error ? error.message : '자막 저장 중 오류가 발생했습니다.';
    const status = message.includes('권한') ? 403 : message.includes('찾을 수 없습니다') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
