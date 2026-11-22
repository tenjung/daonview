'use client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
import { useAuthStore } from '@/store/authStore';

export interface DashboardViewer { user: User; profile: Profile | null }
export function useDashboardViewer(initialViewer?: DashboardViewer) {
  const state = useAuthStore();
  if (!state.isInitialized && initialViewer && !state.isSigningOut) {
    return { ...state, ...initialViewer, isLoading: false };
  }
  return state;
}
