import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true, // 초기 상태는 언제나 로딩 중

  // 0. 데이터 정규화 (Normalizer): DB 값 -> 시스템 규격
  normalizeProfile: (raw: any) => {
    if (!raw) return null;
    return {
      ...raw,
      role: raw.role ? raw.role.toUpperCase() : 'INFLUENCER',
      nickname: raw.nickname || '익명사용자',
    };
  },

  // 1. 프로필 정보 가져오기 (Normalizer 적용)
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
      console.error('[AuthStore] Fetch Profile Error:', err);
    }
  },

  // 2. 초기화 및 리스너 등록 (근본적인 인증 상태 관리)
  initialize: async () => {
    // 이미 로딩이 완료되었거나 체크 중이라면 중복 실행 방지
    if ((get() as any).__initialized) return;
    (get() as any).__initialized = true;

    try {
      // 1. 현재 사용자 서버에서 즉시 검증 (getUser는 getSession보다 안전함)
      const { data: { user }, error } = await supabase.auth.getUser();

      if (user && !error) {
        set({ user, isLoading: true });
        await get().fetchProfile(user.id);
      } else {
        set({ user: null, profile: null });
      }
    } catch (err) {
      console.error('[Auth] Initial User Check Error:', err);
    } finally {
      // 확인이 끝나면 어떤 경우든 로딩 종료
      set({ isLoading: false });
    }

    // 2. 인증 상태 변화 감지 리스너
    supabase.auth.onAuthStateChange(async (event, session) => {
      // 세션 기반 유저 정보
      const sessionUser = session?.user ?? null;
      console.log(`[Auth] Listener Event: ${event}, User: ${sessionUser?.email ?? 'None'}`);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // 보안 강화를 위해 서버에서 다시 한번 검증된 유저 정보 획득
        const { data: { user: verifiedUser } } = await supabase.auth.getUser();
        const finalUser = verifiedUser || sessionUser;

        if (finalUser) {
          set({ user: finalUser, isLoading: true });
          await get().fetchProfile(finalUser.id);
          set({ isLoading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, isLoading: false });
      }
    });
  },

  // 3. 로그아웃 (군더더기 제거 및 명확한 상태 초기화)
  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // 전체 상태 초기화를 위해 안전하게 홈으로 리다이렉트 (window.location.href는 가장 근본적인 리셋 방법)
        window.location.href = '/';
      }
    } catch (error) {
      console.error('SignOut Error:', error);
      set({ isLoading: false });
    }
  },

  hydrate: (user, profile) => {
    set({
      user,
      profile: get().normalizeProfile(profile),
      isLoading: false
    });
    (get() as any).__initialized = true; // 서버에서 하이드레이션했다면 중복 초기화 방지
  }
}));
