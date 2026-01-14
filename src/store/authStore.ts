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
      const currentUser = session?.user ?? null;
      const prevUser = get().user;

      if (currentUser?.id !== prevUser?.id) {
        set({ user: currentUser, isLoading: true });
        
        if (currentUser) {
          await get().syncProfile(currentUser);
        } else {
          set({ profile: null });
        }
        set({ isLoading: false });
      } else if (event === 'SIGNED_IN' && currentUser) {
        // Handle cases where the ID is the same but we just signed in (e.g., re-login)
        await get().syncProfile(currentUser);
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isLoading: false });
  },
}));
