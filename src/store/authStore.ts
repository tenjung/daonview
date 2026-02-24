import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;

  initialize: () => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  normalizeProfile: (raw: any) => any;
  hydrate: (user: any, profile: any) => void;
}

// 리스너 중복 등록 방지용 모듈 레벨 플래그 (Zustand 외부)
let listenerRegistered = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  // DB 값을 시스템 규격으로 정규화
  normalizeProfile: (raw: any) => {
    if (!raw) return null;
    return {
      ...raw,
      role: raw.role ? raw.role.toUpperCase() : 'INFLUENCER',
      nickname: raw.nickname || '익명사용자',
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
    if (listenerRegistered) return;
    listenerRegistered = true;

    const currentUser = get().user;

    if (!currentUser) {
      // hydrate에서 user를 못 받은 상황 → 직접 세션 확인
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          set({ user, isLoading: true });
          await get().fetchProfile(user.id);
        } else {
          set({ user: null, profile: null });
        }
      } catch (err) {
        console.error('[Auth] getUser 오류:', err);
        set({ user: null, profile: null });
      } finally {
        set({ isLoading: false });
      }
    }
    // user가 있으면 hydrate에서 이미 isLoading=false 완료 → 생략

    // 실시간 인증 상태 변화 감지 (로그인/로그아웃/토큰갱신)
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] ${event} | ${session?.user?.email ?? 'none'}`);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const { data: { user: verifiedUser } } = await supabase.auth.getUser();
        if (verifiedUser) {
          set({ user: verifiedUser, isLoading: true });
          await get().fetchProfile(verifiedUser.id);
          set({ isLoading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, isLoading: false });
      }
    });
  },

  // 로그아웃
  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();
      listenerRegistered = false; // 로그아웃 시 리스너 플래그 초기화
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('SignOut 오류:', error);
      set({ isLoading: false });
    }
  },

  /**
   * SSR(layout.tsx)에서 서버 세션을 받아 즉시 store에 주입.
   * user가 null이면 비로그인 상태로 확정.
   */
  hydrate: (user: any, profile: any) => {
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
