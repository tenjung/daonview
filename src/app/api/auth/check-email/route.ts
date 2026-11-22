import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 회원가입 이메일 중복 확인
 * POST /api/auth/check-email { email }
 * DB 함수(check_email_available)를 브라우저에 직접 노출하지 않고, 서버에서 요청 수를 제한한 뒤 조회한다.
 * 인스턴스 메모리 기준 제한이라 완전한 차단은 아니며, 대량 조회 속도를 늦추는 용도다.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestLog = new Map<string, number[]>();

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(key: string, now: number) {
  const recent = (requestLog.get(key) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  requestLog.set(key, recent);

  if (requestLog.size > 5_000) {
    for (const [entryKey, times] of requestLog) {
      if (times.every((time) => now - time >= WINDOW_MS)) requestLog.delete(entryKey);
    }
  }

  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  if (isRateLimited(getClientIp(request), Date.now())) {
    return NextResponse.json({ error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
  }

  const { data, error } = await createAdminClient().rpc('check_email_available', { email_to_check: email });
  if (error || typeof data !== 'boolean') {
    console.error('[check-email] failed:', error);
    return NextResponse.json({ error: '이메일 확인에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ available: data });
}
