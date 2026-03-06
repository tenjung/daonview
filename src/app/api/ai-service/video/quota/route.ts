import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVideoQuota } from '@/lib/video/db';
import type { VideoQuotaResponse } from '@/types/video-assistant';

export async function GET(_: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
    }

    const quota = await getVideoQuota(user.id);
    const response: VideoQuotaResponse = { video: quota };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Video Quota GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '영상 서비스 사용량 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
