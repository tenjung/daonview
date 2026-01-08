import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

interface AuthState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;
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

      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ profile: null });
    }
  },

  initialize: async () => {
    // Already initialized or initializing? 
    // Simplified: checking session and setting up listener once
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ user });

    if (user) {
      await get().fetchProfile(user.id);
    }
    set({ isLoading: false });

    // Set up listener only if not already set (this is tricky in zustand without ref)
    // But since initialize is usually called in a root useEffect, it's fine.
    // To be safe, we could use a flag.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      set({ user: currentUser });

      if (currentUser) {
        await get().fetchProfile(currentUser.id);
      } else {
        set({ profile: null });
      }
      set({ isLoading: false });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
