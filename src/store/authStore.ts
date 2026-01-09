import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

interface AuthState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: any | null) => void;
  setProfile: (profile: any | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found - might be a new user or deleted
          console.warn('Profile not found for user:', userId);
        } else {
          throw error;
        }
      }
      set({ profile: data || null });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ profile: null });
    }
  },

  initialize: async () => {
    // 이미 초기화 작업이 진행 중이거나 완료되었다면 중단
    if (get().isInitialized) return;

    try {
      // 1. 초기 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      set({ user });

      if (user) {
        await get().fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Auth Initialization Error:', error);
    } finally {
      // 로딩 종료 및 초기화 완료 표시 (오류가 나더라도 로딩은 풀어줘야 함)
      set({ isLoading: false, isInitialized: true });
    }

    // 2. 인증 상태 변경 리스너 설정 (한 번만 설정됨)
    supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      
      // 상태가 실제로 변했을 때만 처리 (불필요한 리렌더링 방지)
      const prevUser = get().user;
      if (currentUser?.id !== prevUser?.id) {
        set({ user: currentUser, isLoading: true }); // 프로필 가져오는 동안 다시 로딩 표시 가능 (선택 사항)
        
        if (currentUser) {
          await get().fetchProfile(currentUser.id);
        } else {
          set({ profile: null });
        }
        set({ isLoading: false });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isLoading: false });
  },
}));
