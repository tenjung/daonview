import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../tests/helpers/load-typescript.mjs';

// updateMyProfile: 세션 사용자에게만 저장하고, 0건 수정·세션 불일치를 실패로 처리하는지 확인
function fixture({ sessionUser = { id: 'me' }, authError = null, rows = [{ id: 'me' }], dbError = null } = {}) {
  const calls = { eqId: null, fields: null, updates: 0 };
  const supabase = {
    auth: { getUser: async () => ({ data: { user: sessionUser }, error: authError }) },
    from: (table) => {
      assert.equal(table, 'profiles');
      return {
        update: (fields) => {
          calls.updates += 1;
          calls.fields = fields;
          return {
            eq: (column, value) => {
              assert.equal(column, 'id');
              calls.eqId = value;
              return { select: async () => ({ data: rows, error: dbError }) };
            },
          };
        },
      };
    },
  };
  const refreshed = [];
  const store = { useAuthStore: { getState: () => ({ fetchProfile: async (id) => { refreshed.push(id); } }) } };
  const mod = load('src/lib/profile/updateMyProfile.ts', { '@/lib/supabase/client': { supabase }, '@/store/authStore': store });
  calls.refreshed = refreshed;
  return { mod, calls };
}

test('세션 사용자 ID로 저장한다', async () => {
  const { mod, calls } = fixture();
  const result = await mod.updateMyProfile({ phone_number: '01012345678' }, { expectedUserId: 'me' });
  assert.equal(result.userId, 'me');
  assert.equal(calls.eqId, 'me');
  assert.deepEqual(calls.fields, { phone_number: '01012345678' });
  assert.deepEqual(calls.refreshed, ['me']);
});

test('화면 사용자와 세션 사용자가 다르면 저장하지 않는다', async () => {
  const { mod, calls } = fixture({ sessionUser: { id: 'admin' } });
  await assert.rejects(mod.updateMyProfile({ phone_number: '01012345678' }, { expectedUserId: 'influencer' }), (error) => error.code === 'SESSION_MISMATCH');
  assert.equal(calls.updates, 0);
});

test('0건 수정이면 실패로 처리한다', async () => {
  const { mod } = fixture({ rows: [] });
  await assert.rejects(mod.updateMyProfile({ phone_number: '01012345678' }), (error) => error.code === 'NOT_SAVED');
});

test('로그인 세션이 없으면 실패한다', async () => {
  const { mod, calls } = fixture({ sessionUser: null });
  await assert.rejects(mod.updateMyProfile({ nickname: 'x' }), (error) => error.code === 'NOT_AUTHENTICATED');
  assert.equal(calls.updates, 0);
});

test('DB 오류는 실패로 전달한다', async () => {
  const { mod } = fixture({ dbError: { message: 'PROFILE_PROTECTED_COLUMN' } });
  await assert.rejects(mod.updateMyProfile({ nickname: 'x' }), (error) => error.code === 'DB_ERROR');
});
