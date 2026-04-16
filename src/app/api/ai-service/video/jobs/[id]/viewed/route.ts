import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markVideoJobResultViewed } from '@/lib/video/db';

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
    const job = await markVideoJobResultViewed(id, user.id);
    return NextResponse.json({ job });
  } catch (error) {
    console.error('[Video Job Viewed POST] Error:', error);
    const message = error instanceof Error ? error.message : '영상 조회 기록 중 오류가 발생했습니다.';
    const status = message.includes('권한') ? 403 : message.includes('찾을 수 없습니다') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
