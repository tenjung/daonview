import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

function fixture({ role = 'ADMIN', owner = 'actor', loggedIn = true, matchingApplication = true, resolved = true } = {}) {
  const calls = [];
  const query = (table) => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: table === 'campaigns' ? { created_by: owner } : matchingApplication ? { id: 1 } : null }) });
  const admin = { from: query, rpc: async (name,args) => { calls.push({name,args}); return {data:resolved}; } };
  const server = load('src/lib/selectionEmailHoldServer.ts', {
    'server-only': {},
    '@/lib/auth/requestAuth': { getRequestAuth: async () => ({
      user: loggedIn ? {id:'actor'} : null, profile: {role}, profileError:null,
    }) },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
  });
  const route = load('src/app/api/applications/[id]/email-hold/route.ts', { '@/lib/selectionEmailHoldServer': server });
  const post = (overrides = {}) => route.POST(new Request('https://example.test/api/applications/1/email-hold', {
    method:'POST', body:JSON.stringify({campaignId:44,holdId:'00000000-0000-4000-8000-000000000001',reason:'별도 연락 확인',...overrides}),
  }), {params:Promise.resolve({id:'1'})});
  return {server,calls,post};
}
test('hold reads permit admin and campaign owner, reject anonymous and unrelated advertiser', async () => {
  assert.equal((await fixture({role:'ADMIN',owner:'other'}).server.authorizeEmailHoldAccess(44)).canResolve,true);
  for (const role of ['MASTER','SUPER_ADMIN']) await assert.rejects(fixture({role,owner:'other'}).server.authorizeEmailHoldAccess(44));
  assert.equal((await fixture({role:'ADVERTISER'}).server.authorizeEmailHoldAccess(44)).canResolve,false);
  for (const options of [{loggedIn:false},{role:'ADVERTISER',owner:'other'},{role:'INFLUENCER'}]) await assert.rejects(fixture(options).server.authorizeEmailHoldAccess(44));
});
test('only admin can clear holds; actor is from session and stale versions return 409', async () => {
  const admin = fixture(); assert.equal((await admin.post({actorId:'forged'})).status,200);
  assert.equal(admin.calls[0].args.p_actor_id,'actor');
  assert.equal((await fixture({role:'ADVERTISER'}).post()).status,403);
  assert.equal((await fixture({loggedIn:false}).post()).status,401);
  assert.equal((await fixture({matchingApplication:false}).post()).status,404);
  assert.equal((await fixture({resolved:false}).post()).status,409);
});
test('empty reasons and malformed hold IDs never execute resolution', async () => {
  for (const overrides of [{reason:'   '},{reason:'x'.repeat(501)},{holdId:'bad'},{campaignId:-1}]) {
    const f=fixture(); assert.equal((await f.post(overrides)).status,400); assert.equal(f.calls.length,0);
  }
});
