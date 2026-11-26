import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncSesSuppressionList } from '@/lib/sesSuppressionSync';
import { sendAdminEmailHoldNotice } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** 매일 18:00 KST: SES 차단 목록 → 반송 기록·선정 메일 보류, 새 보류가 있으면 관리자 알림 메일. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cron is not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: 'SES is not configured.' }, { status: 503 });
  }

  let result;
  try {
    result = await syncSesSuppressionList(createAdminClient());
  } catch {
    console.error('SES suppression sync failed');
    return NextResponse.json({ error: 'Suppression sync failed.' }, { status: 500 });
  }

  let noticeSent = false;
  if (result.newHolds.length > 0) {
    try {
      await sendAdminEmailHoldNotice(result.newHolds);
      noticeSent = true;
    } catch {
      // 보류는 이미 저장됨. 알림만 실패했으므로 관리자 화면에서 확인 가능.
      console.error('Email hold notice failed', { newHolds: result.newHolds.length });
    }
  }
  return NextResponse.json({
    success: true, checked: result.checked, recorded: result.recorded,
    skippedKnown: result.skippedKnown, newHolds: result.newHolds.length, noticeSent,
  });
}
