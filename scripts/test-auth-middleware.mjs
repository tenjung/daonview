import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

function fixture(user, error) {
  const cookieJar = () => {
    const values = new Map();
    return { getAll: () => [...values.values()], set(name, value, options) {
      const cookie = typeof name === 'object' ? name : { name, value, ...options };
      values.set(cookie.name, cookie);
    } };
  };
  const response = (kind, status = 200) => ({ kind, status, cookies: cookieJar() });
  const { middleware } = load('src/middleware.ts', {
    'next/server': { NextResponse: { next: () => response('next'), redirect: () => response('redirect', 307), json: (_body, options) => response('error', options.status) } },
    '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: {
      getUser: async () => { options.cookies.setAll([{ name: 'sb-test', value: 'refreshed', options: { httpOnly: true } }]); return { data: { user }, error }; },
    }, from() { throw Error('Middleware must not query DB roles'); } }) },
  });
  const request = { cookies: cookieJar(), nextUrl: { clone: () => ({ pathname: '/dashboard/admin' }) } };
  return async () => ({ result: await middleware(request), request });
}
test('middleware retains refreshed cookies and performs no role query for signed-in users', async () => {
  const { result, request } = await fixture({ id: 'actor' })();
  assert.equal(result.kind, 'next');
  assert.equal(result.cookies.getAll()[0].value, 'refreshed');
  assert.equal(request.cookies.getAll()[0].value, 'refreshed');
});
test('middleware login redirect preserves refreshed/cleared session cookies', async () => {
  const { result } = await fixture(null, { name: 'AuthSessionMissingError', status: 400 })();
  assert.equal(result.kind, 'redirect'); assert.equal(result.cookies.getAll()[0].value, 'refreshed');
});
test('auth transport outage is an explicit 503, not a logout redirect', async () => {
  for (const error of [{ status: 503 }, { status: 0, name: 'AuthRetryableFetchError' }]) {
    const { result } = await fixture(null, error)();
    assert.equal(result.status, 503); assert.equal(result.kind, 'error');
  }
});
