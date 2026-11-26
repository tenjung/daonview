import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeEmailHoldAccess, EmailHoldAccessError } from '@/lib/selectionEmailHoldServer';
import { SelectionKakaoError } from '@/lib/selectionKakaoServer';
import { buildSelectionPreview } from '@/lib/selectionPreviewServer';

export const runtime = 'nodejs';
const bodySchema = z.object({ campaignId: z.number().int().positive() });

/** 선정 메일·알림톡 미리보기(관리자·캠페인 광고주). 알림톡 부분은 관리자에게만. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const applicationId = Number((await context.params).id);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!Number.isSafeInteger(applicationId) || applicationId <= 0 || !body.success) return NextResponse.json({ error: '신청 정보를 확인해 주세요.' }, { status: 400 });
  try {
    const { userId, canResolve } = await authorizeEmailHoldAccess(body.data.campaignId);
    const preview = await buildSelectionPreview({ applicationId, campaignId: body.data.campaignId, actorId: userId, isAdmin: canResolve });
    return NextResponse.json(preview, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof EmailHoldAccessError) return NextResponse.json({ error: '접근 권한을 확인해 주세요.' }, { status: error.status });
    if (error instanceof SelectionKakaoError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Selection preview failed', { applicationId });
    return NextResponse.json({ error: '미리보기를 만들지 못했습니다.' }, { status: 500 });
  }
}
