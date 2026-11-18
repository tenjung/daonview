import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EMAIL_FAILURE_LABELS, type EmailFeedbackRecord } from '@/lib/emailFeedback';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  const { data: profile, error: profileError } = await session.from('profiles').select('role').eq('id', user.id).single();
  if (profileError || String(profile?.role || '').toUpperCase() !== 'ADMIN') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return NextResponse.json({ error: '잘못된 페이지입니다.' }, { status: 400 });
  const { data, count, error } = await createAdminClient().from('email_feedback_events')
    .select('event_key,source,message_id,recipient,event_type,bounce_type,reason,smtp_status,diagnostic,subject,occurred_at', { count: 'exact' })
    .order('occurred_at', { ascending: false }).order('event_key').range((page - 1) * 50, page * 50 - 1);
  if (error) return NextResponse.json({ error: '반송 내역을 불러오지 못했습니다.' }, { status: 500 });
  return NextResponse.json({ page, total: count, events: (data || []).map((event) => ({
    ...event, reason_label: EMAIL_FAILURE_LABELS[event.reason as EmailFeedbackRecord['reason']] || '상세 응답 확인',
    blocks_sending: event.event_type === 'COMPLAINT' || event.bounce_type === 'PERMANENT',
  })) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
