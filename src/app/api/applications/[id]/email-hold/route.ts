import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeEmailHoldAccess, EmailHoldAccessError } from '@/lib/selectionEmailHoldServer';

const bodySchema = z.object({ campaignId: z.number().int().positive(), holdId: z.uuid(), reason: z.string().trim().min(1).max(500) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const applicationId = Number((await context.params).id);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!Number.isSafeInteger(applicationId) || applicationId <= 0 || !body.success) return NextResponse.json({ error: '해제 사유와 보류 정보를 확인해 주세요.' }, { status: 400 });
  try {
    const { admin, userId } = await authorizeEmailHoldAccess(body.data.campaignId, true);
    const { data: application, error } = await admin.from('applications').select('id').eq('id', applicationId).eq('campaign_id', body.data.campaignId).maybeSingle();
    if (error) throw new Error('Application lookup failed');
    if (!application) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 });
    const { data: resolved, error: resolveError } = await admin.rpc('resolve_selection_email_hold', {
      p_application_id: applicationId, p_hold_id: body.data.holdId, p_actor_id: userId, p_reason: body.data.reason,
    });
    if (resolveError) throw new Error('Hold resolution failed');
    if (!resolved) return NextResponse.json({ error: '보류 내역이 변경됐습니다. 새로고침 후 확인해 주세요.' }, { status: 409 });
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const status = error instanceof EmailHoldAccessError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? '보류 해제에 실패했습니다.' : '관리자 권한을 확인해 주세요.' }, { status });
  }
}
