import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeUnsubscribeEmail, verifyUnsubscribeToken } from '@/lib/unsubscribeToken';

/**
 * 이메일 수신 거부 처리 API
 * POST /api/unsubscribe (form: email, token)
 * 메일 보안 스캐너의 링크 미리 열기로 자동 처리되지 않도록 실제 변경은 POST에서만 한다.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const email = String(form?.get('email') || '');
  const token = String(form?.get('token') || '');

  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid', request.url), 303);
  }

  try {
    const { error } = await createAdminClient()
      .from('profiles')
      .update({ email_subscription_status: 'UNSUBSCRIBED' })
      // 대소문자만 무시하고 '_'·'%'는 와일드카드가 아닌 문자로 비교한다.
      .ilike('email', normalizeUnsubscribeEmail(email).replace(/[\\%_]/g, (char) => `\\${char}`));

    if (error) throw error;

    return NextResponse.redirect(new URL('/unsubscribe/success', request.url), 303);
  } catch (error) {
    console.error('Unsubscribe API Error:', error);
    return NextResponse.redirect(new URL('/unsubscribe?error=failed', request.url), 303);
  }
}

/** 이전 형식 링크는 확인 화면으로 보낸다. GET 요청만으로는 수신 상태를 바꾸지 않는다. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = new URL('/unsubscribe', request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  if (email) target.searchParams.set('email', email);
  if (token) target.searchParams.set('token', token);
  return NextResponse.redirect(target, 303);
}
