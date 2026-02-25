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

  initialize: () => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  normalizeProfile: (raw: unknown) => AuthProfile;
  hydrate: (user: SupabaseUser | null, profile: Profile | null) => void;
}

// 리스너 중복 등록 방지용 모듈 레벨 플래그 (Zustand 외부)
let listenerRegistered = false;
let authUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        set({ profile: get().normalizeProfile(data) });
      } else {
        set({ profile: null });
      }
    } catch (err) {
      console.error('[AuthStore] fetchProfile 오류:', err);
      set({ profile: null });
    }
  },

  /**
   * 클라이언트 마운트 시 호출.
   * - hydrate가 이미 user를 채운 경우 → getUser 재호출 생략, 리스너만 등록
   * - hydrate 없이 바로 호출된 경우 → getUser로 직접 확인
   */
  initialize: async () => {
    // 리스너 중복 등록 방지
    if (!listenerRegistered) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[Auth] ${event} | ${session?.user?.email ?? 'none'}`);

        if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, isLoading: false, isInitialized: true });
          return;
        }

        // INITIAL_SESSION을 포함해 세션이 있는 모든 경우를 동일하게 동기화
        if (
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED'
        ) {
          const sessionUser = session?.user ?? null;
          const alreadyInitialized = get().isInitialized;

          if (sessionUser) {
            if (!alreadyInitialized) {
              set({ user: sessionUser, isLoading: true });
            } else {
              set({ user: sessionUser });
            }
            await get().fetchProfile(sessionUser.id);
            set({ isLoading: false, isInitialized: true });
          } else {
            set({ user: null, profile: null, isLoading: false, isInitialized: true });
          }
        }
      });

      authUnsubscribe = () => authListener.subscription.unsubscribe();
      listenerRegistered = true;
    }

    const currentUser = get().user;

    if (!currentUser) {
      // hydrate에서 user를 못 받은 상황 → 먼저 session, 그다음 user 조회
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const sessionUser = session?.user ?? null;
        if (sessionUser) {
          set({ user: sessionUser, isLoading: true });
          await get().fetchProfile(sessionUser.id);
        } else {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();
          if (user && !error) {
            set({ user, isLoading: true });
            await get().fetchProfile(user.id);
          } else {
            set({ user: null, profile: null });
          }
        }
      } catch (err) {
        console.error('[Auth] 세션 초기화 오류:', err);
        set({ user: null, profile: null });
      } finally {
        set({ isLoading: false, isInitialized: true });
      }
    } else {
      set({ isLoading: false, isInitialized: true });
    }
    // user가 있으면 hydrate에서 이미 isLoading=false 완료 → 생략
  },

  // 로그아웃
  signOut: async () => {
    try {
      set({ isLoading: true, user: null, profile: null });
      
      // 1. 서버 측 쿠키 확실히 삭제 (API 라우트 호출)
      // fetch가 실패하더라도 클라이언트 로그아웃은 진행되어야 하므로 에러만 캡처
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (err) {
        console.error('Logout API calling error:', err);
      }
      
      // 2. 클라이언트 세션 정리
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Supabase client signOut error:', error);
    } catch (error) {
      console.error('SignOut 오류:', error);
    } finally {
      authUnsubscribe?.();
      authUnsubscribe = null;
      listenerRegistered = false;
      set({ user: null, profile: null, isLoading: false, isInitialized: true });
    }
  },

  /**
   * SSR(layout.tsx)에서 서버 세션을 받아 즉시 store에 주입.
   * user가 null이면 비로그인 상태로 확정.
   */
  hydrate: (user: SupabaseUser | null, profile: Profile | null) => {
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
