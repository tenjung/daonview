#!/usr/bin/env node
// 에이전트 전용 테스트 계정(관리자/광고주/인플루언서)을 만들거나 맞춘다.
// - 계정 정보는 Vercel Development 환경변수(AGENT_TEST_*)에서 .env.local로 동기화된 값을 사용한다.
// - 이미 있으면 비밀번호·역할·테스트 표시만 다시 맞춘다(여러 번 실행해도 안전).
// - 인증 메일은 발송하지 않는다(email_confirm: true).
// 실행: node --env-file=.env.local scripts/create-agent-test-accounts.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
  process.exit(1);
}

const ACCOUNTS = [
  { role: 'ADMIN', nickname: '에이전트 관리자', prefix: 'AGENT_TEST_ADMIN' },
  { role: 'ADVERTISER', nickname: '에이전트 광고주', prefix: 'AGENT_TEST_ADVERTISER', companyName: '에이전트 테스트 광고주' },
  { role: 'INFLUENCER', nickname: '에이전트 인플루언서', prefix: 'AGENT_TEST_INFLUENCER' },
];

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserByEmail(email) {
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

let failed = false;

for (const account of ACCOUNTS) {
  const email = process.env[`${account.prefix}_EMAIL`];
  const password = process.env[`${account.prefix}_PASSWORD`];
  if (!email || !password) {
    console.error(`[${account.role}] ${account.prefix}_EMAIL / _PASSWORD 환경변수가 없습니다.`);
    failed = true;
    continue;
  }
  if (!email.toLowerCase().endsWith('.test')) {
    console.error(`[${account.role}] 테스트 계정 이메일은 .test 도메인이어야 합니다.`);
    failed = true;
    continue;
  }

  try {
    const metadata = { role: account.role, nickname: account.nickname, is_test_account: true };
    let user = await findUserByEmail(email);
    let action;

    if (user) {
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(user.user_metadata ?? {}), ...metadata },
      });
      if (error) throw error;
      action = '갱신';
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw error;
      user = data.user;
      action = '생성';
    }

    const { error: profileError } = await admin.from('profiles').upsert({
      id: user.id,
      email,
      nickname: account.nickname,
      role: account.role,
      company_name: account.companyName ?? null,
      email_verified: true,
      email_subscription_status: 'UNSUBSCRIBED',
      is_test_account: true,
    }, { onConflict: 'id' });
    if (profileError) throw profileError;

    console.log(`[${account.role}] ${action} 완료`);
  } catch (error) {
    failed = true;
    console.error(`[${account.role}] 실패:`, error?.message ?? error);
  }
}

process.exit(failed ? 1 : 0);
