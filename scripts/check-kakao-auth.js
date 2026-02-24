#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('[FAIL] Missing env:', missing.join(', '));
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP_ORIGIN = process.env.CHECK_AUTH_ORIGIN || 'http://localhost:3000';
const REDIRECT_TO = `${APP_ORIGIN}/auth/callback?next=%2F`;
const EXPECTED_SCOPE = 'account_email profile_nickname';
const EXPECTED_PROMPT = 'select_account';

function assertItem(results, condition, label, detail) {
  const status = condition ? 'PASS' : 'FAIL';
  results.push({ status, label, detail });
}

async function run() {
  const results = [];

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: REDIRECT_TO,
      queryParams: {
        prompt: EXPECTED_PROMPT,
        scope: EXPECTED_SCOPE,
      },
      skipBrowserRedirect: true,
    },
  });

  assertItem(results, !error, 'Supabase OAuth URL generation', error ? error.message : data?.url || 'ok');
  if (error || !data?.url) {
    printResults(results);
    process.exit(1);
  }

  const authUrl = new URL(data.url);
  assertItem(results, authUrl.pathname.endsWith('/auth/v1/authorize'), 'Supabase authorize endpoint', authUrl.toString());

  const authResp = await fetch(authUrl.toString(), {
    method: 'GET',
    redirect: 'manual',
  });

  const location = authResp.headers.get('location');
  assertItem(results, authResp.status === 302, 'Supabase authorize returns 302', `status=${authResp.status}`);
  assertItem(results, Boolean(location), 'Location header exists', location || '(none)');

  if (!location) {
    printResults(results);
    process.exit(1);
  }

  const kakaoUrl = new URL(location);
  const scope = decodeURIComponent((kakaoUrl.searchParams.get('scope') || '').replace(/\+/g, ' ')).trim();
  const prompt = kakaoUrl.searchParams.get('prompt');
  const redirectUri = kakaoUrl.searchParams.get('redirect_uri');

  assertItem(results, kakaoUrl.hostname === 'kauth.kakao.com', 'Kakao authorize host', kakaoUrl.hostname);
  assertItem(results, prompt === EXPECTED_PROMPT, 'Prompt is select_account', prompt || '(none)');
  assertItem(results, scope === EXPECTED_SCOPE, 'Scope matches expected', scope || '(none)');
  assertItem(results, !scope.includes('profile_image'), 'profile_image excluded', scope);
  assertItem(results, !scope.includes('talk_message'), 'talk_message excluded', scope);
  assertItem(
    results,
    redirectUri === `${SUPABASE_URL}/auth/v1/callback`,
    'redirect_uri points to Supabase callback',
    redirectUri || '(none)'
  );

  printResults(results);

  const hasFailure = results.some((r) => r.status === 'FAIL');
  process.exit(hasFailure ? 1 : 0);
}

function printResults(results) {
  console.log('\n[Kakao OAuth Checklist]\n');
  for (const row of results) {
    console.log(`[${row.status}] ${row.label}`);
    if (row.detail) console.log(`       ${row.detail}`);
  }
  console.log('');
}

run().catch((err) => {
  console.error('[FAIL] Unexpected error:', err?.message || err);
  process.exit(1);
});
