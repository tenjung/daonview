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
  fetchProfile: (userId: string) => Promise<any | null>; // Return profile or null
  syncProfile: (user: any) => Promise<void>;
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
          console.warn('Profile not found for user:', userId);
          return null;
        } else {
          throw error;
        }
      }
      set({ profile: data || null });
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ profile: null });
      return null;
    }
  },

  syncProfile: async (user: any) => {
    if (!user) return;

    try {
      // 1. Try to fetch existing profile
      const profile = await get().fetchProfile(user.id);

      // 2. If no profile, create a default one
      if (!profile) {
        console.log('Profile missing, creating default profile for user:', user.email);
        
        // 1. Detect role from URL if present (useful for social signup)
        let initialRole = 'INFLUENCER';
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const roleParam = params.get('role');
          if (roleParam === 'ADVERTISER' || roleParam === 'ADMIN' || roleParam === 'INFLUENCER') {
            initialRole = roleParam;
          }
        }

        // 2. Extract default nickname from email or metadata
        const defaultNickname = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Member';
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            role: initialRole,
            nickname: defaultNickname,
            point: 0
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully');
          set({ profile: newProfile });
        }
      }
    } catch (error) {
      console.error('Error in syncProfile:', error);
    }
  },

  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      set({ user });

      if (user) {
        await get().syncProfile(user);
      }
    } catch (error) {
      console.error('Auth Initialization Error:', error);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);
      const currentUser = session?.user ?? null;
      
      if (currentUser) {
        set({ user: currentUser, isLoading: true });
        await get().syncProfile(currentUser);
        set({ isLoading: false });
      } else {
        // Clear user/profile but keep isLoading if we are in the middle of a manual signOut
        // This prevents the flickering from [Login Button] -> [Skeleton] -> [Login Button]
        set({ user: null, profile: null });
        
        // Ensure browser storage is clean for auth
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('auth-token') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
      }
    });
  },

  signOut: async () => {
    try {
      console.log('Starting SignOut process...');
      // 0. 로딩 상태를 true로 설정하여 UI를 스켈레톤으로 전환 (깜빡임 방지)
      set({ isLoading: true });
      
      // 1. Supabase 로그아웃 호출 (서버 세션 종료)
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut Timeout')), 2000)
      );

      await Promise.race([signOutPromise, timeoutPromise]).catch(e => {
        console.warn('Supabase signOut notice:', e.message);
      });

      // 2. 장바구니 초기화 (비동기 임포트)
      try {
        const { useCartStore } = await import('@/store/cartStore');
        if (useCartStore) {
          useCartStore.getState().clearCart();
        }
      } catch (cartError) {
        console.warn('Logout: Failed to clear cart', cartError);
      }

    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      // 3. 브라우저 스토리지 강제 초기화 (Supabase 관련 모든 키)
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth-token') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
        // 세션 스토리지도 클리어
        sessionStorage.clear();
      }

      // 4. 로컬 상태 즉시 및 최종 초기화
      // isLoading은 true로 유지하여 페이지 리로드 전까지 스켈레톤이 보이게 함
      set({ 
        user: null, 
        profile: null, 
        isInitialized: true 
      });
      
      console.log('SignOut process completed (Loading maintained for redirect).');
    }
  },
}));
