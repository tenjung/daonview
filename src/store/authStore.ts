import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

interface AuthState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;
  
  initialize: () => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true, // 초기 상태는 언제나 로딩 중

  // 1. 프로필 정보만 전문적으로 가져오는 함수
  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error) {
        set({ profile: data });
      } else if (error.code === 'PGRST116') {
        // 프로필이 없는 신규 유저의 경우 (필요 시 여기서 생성 로직 호출 가능)
        set({ profile: null });
      }
    } catch (err) {
      console.error('Fetch Profile Error:', err);
    }
  },

  // 2. 초기화 및 리스너 등록 (가장 중요: 모든 상태 변화의 유일한 통로)
  initialize: () => {
    // 6.0.8 등 최신 Next.js 환경에서 여러 번 호출되는 것 방지
    if ((globalThis as any).__authInitialized) return;
    (globalThis as any).__authInitialized = true;

    // 초기 세션 확인 및 리스너 등록
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      
      console.log(`[Auth] Event: ${event}, User: ${user?.email ?? 'None'}`);

      if (user) {
        set({ user, isLoading: true });
        await get().fetchProfile(user.id);
        set({ isLoading: false });
      } else {
        set({ user: null, profile: null, isLoading: false });
      }
    });
  },

  // 3. 로그아웃 (군더더기 제거)
  signOut: async () => {
    try {
      set({ isLoading: true }); // 즉각적으로 반영
      await supabase.auth.signOut();
      
      // 스토리지 수동 삭제는 Supabase가 처리하지만, 확실히 하기 위해 전체 클리어
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/'; // 홈으로 이동하며 전체 상태 리셋 (가장 깔끔함)
      }
    } catch (error) {
      console.error('SignOut Error:', error);
      set({ isLoading: false });
    }
  },
}));
