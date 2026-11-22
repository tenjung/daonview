import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

function fixture() {
  let state, listener, calls = 0;
  const pending = [];
  const { useAuthStore } = load('src/store/authStore.ts', {
    zustand: { create: (init) => {
      const set = (next) => { state = { ...state, ...next }; };
      state = init(set, () => state);
      return { getState: () => state };
    } },
    '@/lib/supabase/client': { supabase: {
      auth: { onAuthStateChange: (cb) => { listener = cb; } },
      // 본인 프로필은 get_my_profile RPC로만 조회한다.
      rpc: (name) => { assert.equal(name, 'get_my_profile'); return { single: () => {
        calls++; return new Promise(resolve => pending.push(resolve));
      } }; },
    } },
  });
  return { store: useAuthStore, event: (name, id = 'a') => listener(name, id ? { user: { id } } : null), pending, calls: () => calls };
}
test('SSR profile survives initial auth event without fetch; token refresh reloads', async () => {
  const f = fixture(), s = f.store.getState();
  s.hydrate({ id: 'a' }, { id: 'a', role: 'INFLUENCER' }); s.initialize();
  f.event('INITIAL_SESSION'); f.event('SIGNED_IN'); assert.equal(f.calls(), 0);
  f.event('TOKEN_REFRESHED'); assert.equal(f.calls(), 1);
  f.pending.shift()({ data: { id: 'a', role: 'ADVERTISER' }, error: null });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.store.getState().profile.role, 'ADVERTISER');
});
test('concurrent fetches merge; account switch rejects stale response', async () => {
  const f = fixture(), s = f.store.getState();
  s.hydrate({ id: 'a' }, { id: 'a', role: 'INFLUENCER' }); s.initialize();
  const a = s.fetchProfile('a'), a2 = s.fetchProfile('a'); assert.equal(f.calls(), 1);
  f.event('SIGNED_IN', 'b'); assert.equal(f.calls(), 2);
  f.pending[0]({ data: { id: 'a', role: 'ADMIN' }, error: null });
  f.pending[1]({ data: { id: 'b', role: 'ADVERTISER' }, error: null });
  await Promise.all([a, a2]); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.store.getState().user.id, 'b'); assert.equal(f.store.getState().profile.id, 'b');
});
test('profile failure keeps authenticated user and exposes error; missing role is never defaulted', async () => {
  const f = fixture(), s = f.store.getState(); s.hydrate({ id: 'a' }, null); s.initialize();
  const p = s.fetchProfile('a'); f.pending[0]({ data: null, error: { message: 'offline' } }); await p;
  assert.equal(f.store.getState().user.id, 'a'); assert(f.store.getState().profileError);
  assert.equal(s.normalizeProfile({ id: 'a' }).role, undefined);
});


test('user update refreshes profile and signout discards a pending profile response', async () => {
  const f = fixture(), s = f.store.getState();
  s.hydrate({ id: 'a' }, { id: 'a', role: 'INFLUENCER' }); s.initialize();
  f.event('USER_UPDATED'); assert.equal(f.calls(), 1);
  f.event('SIGNED_OUT', null);
  f.pending[0]({ data: { id: 'a', role: 'ADMIN' }, error: null });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.store.getState().user, null); assert.equal(f.store.getState().profile, null);
});
