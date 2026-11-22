import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
import { toClientProfile } from '@/lib/auth/clientProfile';
import { coerceDashboardRole } from '@/constants/role';

type AuthProfile = Profile | null;

interface AuthState {
  user: SupabaseUser | null;
  profile: AuthProfile;
  isLoading: boolean;
  isInitialized: boolean;
  isSigningOut: boolean;
  isProfileLoading: boolean;
  profileError: string | null;

  initialize: () => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  normalizeProfile: (raw: unknown) => AuthProfile;
  hydrate: (user: SupabaseUser | null, profile: Profile | null) => void;
}

// 리스너 중복 등록 방지용 모듈 레벨 플래그 (Zustand 외부)
let listenerRegistered = false;
let authGeneration = 0;
let profileRequest: { userId: string; generation: number; promise: Promise<void> } | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  isSigningOut: false,
  isProfileLoading: false,
  profileError: null,

  // DB 값을 시스템 규격으로 정규화
  normalizeProfile: (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as Profile;
    const normalizedRole = source.role
      ? (source.role.toUpperCase() as Profile['role'])
      : undefined;

    return {
      ...toClientProfile(source),
      id: source.id,
      role: normalizedRole,
      nickname: source.nickname || '익명사용자',
    };
  },

  // 프로필 조회
  fetchProfile: async (userId: string) => {
    if (get().isSigningOut || get().user?.id !== userId) return;
    const generation = authGeneration;
    if (profileRequest?.userId === userId && profileRequest.generation === generation) return profileRequest.promise;
    const isCurrent = () => generation === authGeneration && get().user?.id === userId && !get().isSigningOut;
    const promise = (async () => {
      set({ isProfileLoading: true, profileError: null });
      try {
        const { data, error } = await supabase.rpc('get_my_profile').single<Profile>();
        if (!isCurrent()) return;
        if (error || !data || !coerceDashboardRole(data.role)) {
          set({ profileError: '프로필을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
          return;
        }
        set({ profile: get().normalizeProfile(data), profileError: null });
      } catch {
        if (isCurrent()) set({ profileError: '프로필을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      } finally {
        if (isCurrent()) set({ isProfileLoading: false });
      }
    })();
    profileRequest = { userId, generation, promise };
    try { await promise; } finally {
      if (profileRequest?.promise === promise) profileRequest = null;
    }
  },

  initialize: () => {
    if (listenerRegistered) return;
    listenerRegistered = true;

    supabase.auth.onAuthStateChange((event, session) => {
      if (get().isSigningOut) return;
      if (
        event !== 'INITIAL_SESSION' &&
        event !== 'SIGNED_IN' &&
        event !== 'SIGNED_OUT' &&
        event !== 'TOKEN_REFRESHED' &&
        event !== 'USER_UPDATED'
      ) return;

      const user = session?.user ?? null;
      const sameUser = Boolean(user && user.id === get().user?.id);
      const reuseProfile = sameUser && Boolean(coerceDashboardRole(get().profile?.role)) && !get().profileError
        && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN');
      if (!sameUser) authGeneration++;

      set({
        user,
        profile: sameUser ? get().profile : null,
        isLoading: false,
        isInitialized: true,
        isProfileLoading: Boolean(user) && !reuseProfile,
        profileError: sameUser ? get().profileError : null,
      });
      if (user && !reuseProfile) void get().fetchProfile(user.id);
    });
  },

  signOut: async () => {
    if (get().isSigningOut) return;

    authGeneration++;
    set({ isSigningOut: true });

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      // Keep the current view stable until the new document reads the cleared cookies.
      window.location.replace('/');
    } catch (error) {
      set({ isSigningOut: false, isInitialized: true, isLoading: false });
      const { user } = get();
      if (user) void get().fetchProfile(user.id);
      throw error;
    }
  },

  /**
   * SSR(layout.tsx)에서 서버 세션을 받아 즉시 store에 주입.
   * user가 null이면 비로그인 상태로 확정.
   */
  hydrate: (user: SupabaseUser | null, profile: Profile | null) => {
    if (get().isInitialized || get().isSigningOut) return;

    if (user) {
      set({
        user,
        profile: get().normalizeProfile(profile),
        isLoading: false,
        profileError: null,
      });
    } else {
      set({ user: null, profile: null, isLoading: false });
    }
  },
}));
