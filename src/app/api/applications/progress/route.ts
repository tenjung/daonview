import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { canEditCampaign } from '@/lib/campaignPermissions';

/**
 * 선정 이후 진행 단계 처리 (구매 확인·연장 요청·연장 결정·송장 등록)
 * applications UPDATE RLS는 PENDING 본인 또는 관리자만 허용하므로,
 * 서버에서 역할·소유권·현재 상태를 확인한 뒤 정해진 컬럼만 서버 권한으로 수정한다.
 */
const REVIEW_PERIOD_DAYS = 7;
const SELECTED_STATUSES = ['SELECTED', 'APPROVED'];

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('CONFIRM_PURCHASE'), applicationId: z.number().int().positive() }),
  z.object({ action: z.literal('REQUEST_EXTENSION'), applicationId: z.number().int().positive(), reason: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal('DECIDE_EXTENSION'), applicationId: z.number().int().positive(), decision: z.enum(['APPROVED', 'REJECTED']) }),
  z.object({ action: z.literal('REGISTER_TRACKING'), applicationId: z.number().int().positive(), company: z.string().trim().min(1).max(100), number: z.string().trim().min(1).max(100) }),
]);

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export async function POST(request: Request) {
  try {
    const { user, profile, role, profileError, supabase } = await getRequestAuth();
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    if (profileError) return NextResponse.json({ error: profileError }, { status: 503 });
    if (!role || !profile) return NextResponse.json({ error: '사용자 권한을 확인할 수 없습니다.' }, { status: 403 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: '처리 정보를 확인해 주세요.' }, { status: 400 });
    const body = parsed.data;

    // 사용자 세션으로 조회해 SELECT RLS(본인·캠페인 소유자·관리자)를 그대로 적용한다.
    const found = await supabase
      .from('applications')
      .select('id,user_id,status,purchased_at,review_deadline,extension_status,campaigns(created_by)')
      .eq('id', body.applicationId)
      .maybeSingle();
    if (found.error) throw new Error('조회 실패');
    if (!found.data) return NextResponse.json({ error: '신청 내역을 찾을 수 없습니다.' }, { status: 404 });

    const row = found.data;
    const status = String(row.status || '').toUpperCase();
    const extensionStatus = String(row.extension_status || '').toUpperCase();
    if (!SELECTED_STATUSES.includes(status)) return NextResponse.json({ error: '선정된 신청만 처리할 수 있습니다.' }, { status: 409 });

    const now = new Date();
    let update: Record<string, string>;
    let guard: { column: string; value: string | null } | null = null;

    if (body.action === 'CONFIRM_PURCHASE' || body.action === 'REQUEST_EXTENSION') {
      if (row.user_id !== user.id) return NextResponse.json({ error: '처리 권한이 없습니다.' }, { status: 403 });
      if (body.action === 'CONFIRM_PURCHASE') {
        if (row.purchased_at) return NextResponse.json({ error: '이미 구매 확인이 완료되었습니다.' }, { status: 409 });
        update = { purchased_at: now.toISOString(), review_deadline: addDays(now, REVIEW_PERIOD_DAYS) };
        guard = { column: 'purchased_at', value: null };
      } else {
        if (extensionStatus === 'PENDING') return NextResponse.json({ error: '이미 연장 요청이 접수되었습니다.' }, { status: 409 });
        update = { extension_status: 'PENDING', extension_reason: body.reason };
      }
    } else {
      const campaign = (Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns) as { created_by?: string } | null;
      if (!canEditCampaign({ role: profile.role, userId: user.id, campaignCreatorId: campaign?.created_by })) {
        return NextResponse.json({ error: '처리 권한이 없습니다.' }, { status: 403 });
      }
      if (body.action === 'DECIDE_EXTENSION') {
        if (extensionStatus !== 'PENDING') return NextResponse.json({ error: '대기 중인 연장 요청이 없습니다.' }, { status: 409 });
        update = { extension_status: body.decision };
        if (body.decision === 'APPROVED' && row.review_deadline) {
          update.review_deadline = addDays(new Date(row.review_deadline), REVIEW_PERIOD_DAYS);
        }
        guard = { column: 'extension_status', value: 'PENDING' };
      } else {
        update = {
          tracking_company: body.company,
          tracking_number: body.number,
          shipped_at: now.toISOString(),
          review_deadline: addDays(now, REVIEW_PERIOD_DAYS),
        };
      }
    }

    // 확인한 상태가 그대로일 때만 수정해 동시 요청에 의한 중복 처리를 막는다.
    let query = createAdminClient().from('applications').update(update).eq('id', row.id).in('status', SELECTED_STATUSES);
    if (guard) query = guard.value === null ? query.is(guard.column, null) : query.eq(guard.column, guard.value);
    const result = await query.select('id,review_deadline').maybeSingle();
    if (result.error) throw new Error('수정 실패');
    if (!result.data) return NextResponse.json({ error: '신청 상태가 변경되었습니다. 새로고침해 주세요.' }, { status: 409 });

    return NextResponse.json({ success: true, reviewDeadline: result.data.review_deadline ?? null });
  } catch {
    return NextResponse.json({ error: '처리 결과를 확인하지 못했습니다. 재시도 전에 목록을 확인해 주세요.' }, { status: 500 });
  }
}
