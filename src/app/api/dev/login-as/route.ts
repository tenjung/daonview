import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getRoleDashboardPath, normalizeRole } from '@/constants/role';

// 개발 전용: 에이전트 테스트 계정으로 비밀번호 없이 로그인한다.
// 운영 빌드(NODE_ENV=production)와 localhost 외 접속에서는 존재하지 않는 경로처럼 404를 반환한다.

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

const ROLE_EMAIL_ENV: Record<string, string> = {
  ADMIN: 'AGENT_TEST_ADMIN_EMAIL',
  ADVERTISER: 'AGENT_TEST_ADVERTISER_EMAIL',
  INFLUENCER: 'AGENT_TEST_INFLUENCER_EMAIL',
};

function notFound() {
  return new NextResponse('Not Found', { status: 404 });
}

function getHostname(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).hostname;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development' || process.env.VERCEL_ENV === 'production') {
    return notFound();
  }

  const requestHost = getHostname(request.headers.get('host'));
  const urlHost = new URL(request.url).hostname;
  if (!requestHost || !LOCAL_HOSTNAMES.has(requestHost) || !LOCAL_HOSTNAMES.has(urlHost)) {
    return notFound();
  }

  // 같은 출처(localhost)에서 온 요청만 허용
  const originHost = getHostname(request.headers.get('origin'));
  if (originHost && !LOCAL_HOSTNAMES.has(originHost)) {
    return notFound();
  }

  const body = await request.json().catch(() => null) as { role?: unknown } | null;
  const role = normalizeRole(typeof body?.role === 'string' ? body.role : '');
  const emailEnvKey = ROLE_EMAIL_ENV[role];
  if (!emailEnvKey) {
    return NextResponse.json({ error: '지원하지 않는 역할입니다.' }, { status: 400 });
  }

  const email = process.env[emailEnvKey];
  if (!email || !email.toLowerCase().endsWith('.test')) {
    return NextResponse.json(
      { error: `${emailEnvKey} 환경변수가 없습니다. 작업 시작 동기화(.env.local)를 확인하세요.` },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  // 실제 회원으로 로그인되는 일이 없도록 테스트 계정 표시와 역할을 다시 확인한다.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, is_test_account')
    .eq('email', email)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: '테스트 계정 프로필을 확인하지 못했습니다.' }, { status: 500 });
  }
  if (!profile || profile.is_test_account !== true || normalizeRole(profile.role) !== role) {
    return NextResponse.json(
      { error: '테스트 계정이 없거나 설정이 맞지 않습니다. scripts/create-agent-test-accounts.mjs를 실행하세요.' },
      { status: 409 }
    );
  }

  // 메일 발송 없이 일회용 로그인 토큰을 만들고, 서버에서 바로 검증해 세션 쿠키를 설정한다.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    return NextResponse.json({ error: '로그인 토큰을 만들지 못했습니다.' }, { status: 500 });
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });
  if (verifyError) {
    return NextResponse.json({ error: '세션을 만들지 못했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role, redirectTo: getRoleDashboardPath(role) });
}
