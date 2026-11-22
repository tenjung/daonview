import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { coerceDashboardRole } from '@/constants/role';
import type { Profile } from '@/types/database';

/** React cache is scoped to this render/request, never shared between users. */
export const getRequestAuth = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const invalidSession = authError && (authError.name === 'AuthSessionMissingError' || authError.status === 401
    || ['session_not_found', 'refresh_token_not_found', 'refresh_token_already_used', 'bad_jwt', 'jwt_expired', 'user_not_found', 'user_banned'].includes(authError.code || ''));
  if (authError && !invalidSession) throw new Error('사용자 인증을 확인하지 못했습니다.');
  if (invalidSession || !user) return { supabase, user: null, profile: null, role: null, profileError: null };
  const { data, error } = await supabase.rpc('get_my_profile').maybeSingle();
  const profile = data as Profile | null;
  return {
    supabase, user, profile: error ? null : profile,
    role: error ? null : coerceDashboardRole(profile?.role),
    profileError: error ? '프로필을 불러오지 못했습니다.' : !profile ? '프로필을 찾을 수 없습니다.' : null,
  };
});

export async function requireRequestUser() {
  const auth = await getRequestAuth();
  if (!auth.user) throw new Error('인증이 필요합니다.');
  if (auth.profileError) throw new Error(auth.profileError);
  if (!auth.role) throw new Error('사용자 권한을 확인할 수 없습니다.');
  return { ...auth, user: auth.user, profile: auth.profile! };
}
