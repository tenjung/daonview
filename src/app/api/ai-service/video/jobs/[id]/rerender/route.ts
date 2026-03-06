import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthorizedVideoJob, updateVideoJob } from '@/lib/video/db';

export const runtime = 'nodejs';

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
    }

    const { id } = await context.params;
    const job = await getAuthorizedVideoJob(id, user.id);
    const subtitleSource = String(job.subtitle_final || job.subtitle_draft || '').trim();

    if (!subtitleSource) {
      return NextResponse.json({ error: '재렌더링할 자막이 없습니다.' }, { status: 400 });
    }

    if (!job.audio_url) {
      return NextResponse.json({ error: '재렌더링에 필요한 오디오 파일이 없습니다.' }, { status: 400 });
    }

    const updatedJob = await updateVideoJob(id, {
      status: 'QUEUED',
      progress: 0,
      error_message: null,
      subtitle_final: subtitleSource,
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('[Video Job Rerender POST] Error:', error);
    const message = error instanceof Error ? error.message : '재렌더링 요청 중 오류가 발생했습니다.';
    const status = message.includes('권한') ? 403 : message.includes('찾을 수 없습니다') ? 404 : message.includes('없습니다') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
