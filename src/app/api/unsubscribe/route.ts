import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 이메일 수신 거부 처리 API
 * GET /api/unsubscribe?email=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // 이메일 수신 상태를 'UNSUBSCRIBED'로 업데이트
    const { error } = await supabase
      .from('profiles')
      .update({ email_subscription_status: 'UNSUBSCRIBED' })
      .eq('email', email);

    if (error) throw error;

    // 수신 거부 완료 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/unsubscribe/success', request.url));
  } catch (error: any) {
    console.error('Unsubscribe API Error:', error);
    return NextResponse.json({ error: 'Failed to process unsubscribe' }, { status: 500 });
  }
}
