import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

test('SSR dashboard reads enforce role/owner scope and trim the client profile', async () => {
  const queries = []; let guards = 0;
  const { getInfluencerInitialData, getAdvertiserInitialData } = load('src/lib/dashboardData.ts', {
    'server-only': {},
    '@/lib/auth/requireDashboardRole': { requireDashboardRole: async () => { guards++; } },
    '@/lib/auth/requestAuth': { getRequestAuth: async () => ({ user: { id: 'actor' }, profile: { id: 'actor', account_number: 'private' }, supabase: {
      from(table) {
        const q = { table, filters: [], select() { return this; }, eq(...args) { this.filters.push(args); return this; }, in() { return this; }, neq() { return this; }, or() { return this; }, order() { return this; }, limit() { return this; },
          then(resolve) { queries.push(q); return Promise.resolve({ data: [], error: null }).then(resolve); } };
        return q;
      },
    } }) },
  });
  for (const kind of ['overview', 'campaigns', 'favorites', 'reviews']) {
    const data = await getInfluencerInitialData(kind);
    assert.equal(data.viewer.profile.account_number, undefined);
  }
  await getAdvertiserInitialData();
  assert.equal(guards, 5);
  assert.equal(queries.length, 6);
  for (const q of queries) assert(q.filters.some(([key, value]) => ['user_id', 'created_by'].includes(key) && value === 'actor'));
});

test('request guard rejects superseded responses, account changes, signout and unmount', () => {
  let state = { isInitialized: true, user: { id: 'a' }, isSigningOut: false }, cleanup;
  const { useRequestGuard } = load('src/hooks/useRequestGuard.ts', {
    react: { useRef: () => ({ current: 0 }), useCallback: fn => fn, useEffect: fn => { cleanup = fn(); } },
    '@/store/authStore': { useAuthStore: { getState: () => state } },
  });
  const begin = useRequestGuard('a');
  const first = begin(), second = begin();
  assert.equal(first(), false); assert.equal(second(), true);
  state = { ...state, user: { id: 'b' } }; assert.equal(second(), false);
  state = { ...state, user: { id: 'a' }, isSigningOut: true }; assert.equal(second(), false);
  state = { ...state, isSigningOut: false }; const latest = begin(); cleanup(); assert.equal(latest(), false);
});

test('SSR viewer is used until hydration, never overrides an initialized account or signout', () => {
  let state = { isInitialized: false, user: null, isSigningOut: false, isLoading: true };
  const { useDashboardViewer } = load('src/hooks/useDashboardViewer.ts', { '@/store/authStore': { useAuthStore: () => state } });
  const viewer = { user: { id: 'a' }, profile: { role: 'INFLUENCER' } };
  assert.equal(useDashboardViewer(viewer).user.id, 'a');
  state = { ...state, isInitialized: true, user: { id: 'b' } }; assert.equal(useDashboardViewer(viewer).user.id, 'b');
  state = { ...state, user: null, isSigningOut: true }; assert.equal(useDashboardViewer(viewer).user, null);
});

test('community metadata/page reads share only the same request key; event filtering stays distinct', async () => {
  const reads = [];
  const { getCommunityPost, getCommunityNotice } = load('src/lib/community/readServer.ts', {
    'server-only': {},
    react: { cache: fn => { const values = new Map(); return (...args) => { const key = JSON.stringify(args); if (!values.has(key)) values.set(key, fn(...args)); return values.get(key); }; } },
    '@/lib/supabase/server': { createClient: async () => ({ from(table) {
      const filters = [];
      return { select() { return this; }, eq(...args) { filters.push(args); return this; }, async single() { reads.push({ table, filters }); return { data: { id: filters[0][1], title: 'fixture' }, error: null }; } };
    } }) },
  });
  await Promise.all([getCommunityPost('1'), getCommunityPost('1')]);
  await Promise.all([getCommunityNotice('2'), getCommunityNotice('2')]);
  await getCommunityNotice('2', true);
  assert.equal(reads.length, 3);
  assert(reads[2].filters.some(([key, value]) => key === 'type' && value === '이벤트'));
});
