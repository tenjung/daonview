import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

type AuthProfile = Profile | null;

interface AuthState {
  user: SupabaseUser | null;
  profile: AuthProfile;
  isLoading: boolean;
  isInitialized: boolean;
  isSigningOut: boolean;
  isProfileLoading: boolean;

  initialize: () => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  normalizeProfile: (raw: unknown) => AuthProfile;
  hydrate: (user: SupabaseUser | null, profile: Profile | null) => void;
}

// 리스너 중복 등록 방지용 모듈 레벨 플래그 (Zustand 외부)
let listenerRegistered = false;
let authGeneration = 0;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  isSigningOut: false,
  isProfileLoading: false,

  // DB 값을 시스템 규격으로 정규화
  normalizeProfile: (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return null;
    const source = raw as Profile;
    const normalizedRole = source.role
      ? (source.role.toUpperCase() as Profile['role'])
      : 'INFLUENCER';

    return {
      ...source,
      role: normalizedRole,
      nickname: source.nickname || '익명사용자',
    };
  },

  // 프로필 조회
  fetchProfile: async (userId: string) => {
    if (get().isSigningOut || get().user?.id !== userId) return;

    const generation = authGeneration;
    const isCurrent = () => generation === authGeneration && get().user?.id === userId;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!isCurrent()) return;

      if (!error && data) {
        set({ profile: get().normalizeProfile(data) });
      } else {
        set({ profile: null });
      }
    } catch (err) {
      if (!isCurrent()) return;
      console.error('[AuthStore] fetchProfile 오류:', err);
      set({ profile: null });
    } finally {
      if (isCurrent()) set({ isProfileLoading: false });
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
      if (!sameUser) authGeneration++;

      set({
        user,
        profile: sameUser ? get().profile : null,
        isLoading: false,
        isInitialized: true,
        isProfileLoading: Boolean(user),
      });
      if (user) void get().fetchProfile(user.id);
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
      });
    } else {
      set({ user: null, profile: null, isLoading: false });
    }
  },
}));
