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

          if (sessionUser) {
            set({ user: sessionUser, isLoading: false, isInitialized: true });
            void get().fetchProfile(sessionUser.id);
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
          // 인증 초기화는 프로필 조회 성공/실패와 분리한다.
          // 프로필 네트워크 지연이 앱 전체 로딩을 잠그지 않도록 즉시 부팅 완료 처리.
          set({ user: sessionUser, isLoading: false, isInitialized: true });
          void get().fetchProfile(sessionUser.id);
        } else {
          // 세션이 없으면 비로그인 상태로 확정한다.
          // getUser()를 추가 호출하면 AuthSessionMissingError가 발생할 수 있다.
          set({ user: null, profile: null });
        }
      } catch (err) {
        const isExpectedMissingSession =
          typeof err === 'object' &&
          err !== null &&
          'name' in err &&
          String((err as { name?: string }).name) === 'AuthSessionMissingError';

        if (!isExpectedMissingSession) {
          console.error('[Auth] 세션 초기화 오류:', err);
        }
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

      const clientSignOutTask = new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.error('[AuthStore] Client signOut timeout');
          resolve();
        }, 3000);

        supabase.auth
          .signOut()
          .then(({ error }) => {
            if (error) console.error('Supabase client signOut error:', error);
          })
          .catch((err) => {
            console.error('[AuthStore] Client signOut exception:', err);
          })
          .finally(() => {
            clearTimeout(timeoutId);
            resolve();
          });
      });

      const serverLogoutTask = new Promise<void>((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 2500);

        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        })
          .catch((err) => {
            console.error('[AuthStore] Logout API calling error:', err);
          })
          .finally(() => {
            clearTimeout(timeoutId);
            resolve();
          });
      });

      await Promise.all([clientSignOutTask, serverLogoutTask]);
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
