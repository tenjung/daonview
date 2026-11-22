import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from '../tests/helpers/load-typescript.mjs';

function fixture({ role = 'ADMIN', user = { id: 'actor' }, profileMissing = false, profileError = null, authError = null } = {}) {
  let authCalls = 0, profileCalls = 0;
  const auth = load('src/lib/auth/requestAuth.ts', {
    'server-only': {},
    react: { cache: (fn) => { let pending; return () => pending ??= fn(); } },
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => { authCalls++; return { data: { user }, error: authError }; } },
      // 본인 프로필은 get_my_profile RPC로만 조회한다.
      rpc: (name) => { assert.equal(name, 'get_my_profile'); return { maybeSingle: async () => {
        profileCalls++; return { data: profileMissing ? null : { id: 'actor', role }, error: profileError };
      } }; },
    }) },
  });
  const guard = load('src/lib/auth/requireDashboardRole.ts', {
    '@/lib/auth/requestAuth': auth,
    'next/navigation': { redirect: (url) => { throw new Error(`redirect:${url}`); } },
  });
  return { auth, guard, counts: () => ({ authCalls, profileCalls }) };
}

test('one request shares user/profile across concurrent consumers; requests stay isolated', async () => {
  const a = fixture(), b = fixture({ role: 'ADVERTISER' });
  await Promise.all([a.auth.getRequestAuth(), a.guard.requireDashboardRole('ADMIN'), a.auth.getRequestAuth()]);
  assert.deepEqual(a.counts(), { authCalls: 1, profileCalls: 1 });
  assert.equal((await b.auth.getRequestAuth()).role, 'ADVERTISER');
  assert.equal((await a.auth.getRequestAuth()).role, 'ADMIN');
});
test('DB roles and admin aliases only; metadata cannot grant access', async () => {
  for (const role of ['ADMIN', 'MASTER', 'SUPER_ADMIN', 'admin']) {
    assert.equal((await fixture({ role }).guard.requireDashboardRole('ADMIN')).role, 'ADMIN');
  }
  await assert.rejects(fixture({ role: 'INFLUENCER', user: { id: 'actor', user_metadata: { role: 'ADMIN' } } })
    .guard.requireDashboardRole('ADMIN'), /dashboard\/influencer/);
  await assert.rejects(fixture({ profileMissing: true }).guard.requireDashboardRole('ADMIN'), /프로필/);
  await assert.rejects(fixture({ profileError: { message: 'offline' } }).guard.requireDashboardRole('ADMIN'), /프로필/);
  await assert.rejects(fixture({ user: null }).guard.requireDashboardRole('ADMIN'), /redirect:\/login/);
});
test('global client profile excludes bank, address and unknown columns', () => {
  const { toClientProfile } = load('src/lib/auth/clientProfile.ts');
  const result = toClientProfile({ id: 'actor', role: 'ADMIN', nickname: '관리자', account_number: 'secret', address_base: 'secret', internal: 'secret' });
  assert.equal(result.nickname, '관리자');
  for (const key of ['account_number', 'address_base', 'internal']) assert.equal(key in result, false);
});
test('every role dashboard page has a server role guard', () => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name === 'page.tsx' ? [path.join(dir, e.name)] : []);
  for (const [role, dir] of [['ADMIN', 'admin'], ['ADVERTISER', 'advertiser'], ['INFLUENCER', 'influencer']]) {
    for (const file of walk(`src/app/dashboard/${dir}`)) {
      const source = fs.readFileSync(file, 'utf8');
      assert(source.includes(`await requireDashboardRole('${role}')`), file);
      assert(!source.includes('use client'), file);
    }
  }
});


test('expired sessions deny access, transient auth failures remain explicit, all cross-role accesses redirect', async () => {
  for (const authError of [{ name: 'AuthSessionMissingError' }, { status: 401 }, { status: 400, code: 'refresh_token_not_found' }]) {
    await assert.rejects(fixture({ authError }).guard.requireDashboardRole('ADMIN'), /redirect:\/login/);
  }
  await assert.rejects(fixture({ authError: { status: 503, name: 'AuthRetryableFetchError' } }).auth.getRequestAuth(), /인증을 확인하지 못/);
  for (const role of ['ADMIN', 'ADVERTISER', 'INFLUENCER']) {
    for (const target of ['ADMIN', 'ADVERTISER', 'INFLUENCER']) {
      if (role !== target) await assert.rejects(fixture({ role }).guard.requireDashboardRole(target), new RegExp('dashboard/' + role.toLowerCase()));
    }
  }
});
