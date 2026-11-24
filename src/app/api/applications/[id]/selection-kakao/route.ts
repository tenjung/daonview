import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeEmailHoldAccess, EmailHoldAccessError } from '@/lib/selectionEmailHoldServer';
import { SelectionKakaoError, sendSelectionKakaoForHold } from '@/lib/selectionKakaoServer';

const bodySchema = z.object({ campaignId: z.number().int().positive(), holdId: z.uuid() });

/** 메일 반송 보류 건에 선정 안내 알림톡 수동 발송(관리자 전용). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const applicationId = Number((await context.params).id);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!Number.isSafeInteger(applicationId) || applicationId <= 0 || !body.success) return NextResponse.json({ error: '보류 정보를 확인해 주세요.' }, { status: 400 });
  try {
    const { userId } = await authorizeEmailHoldAccess(body.data.campaignId, true);
    const result = await sendSelectionKakaoForHold({ applicationId, campaignId: body.data.campaignId, holdId: body.data.holdId, actorId: userId });
    return NextResponse.json({ success: true, kakao: result }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof EmailHoldAccessError) return NextResponse.json({ error: '관리자 권한을 확인해 주세요.' }, { status: error.status });
    if (error instanceof SelectionKakaoError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Selection kakao route failed', { applicationId });
    return NextResponse.json({ error: '알림톡 발송에 실패했습니다.' }, { status: 500 });
  }
}
