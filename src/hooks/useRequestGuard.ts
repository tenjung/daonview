'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

/** Ignore late responses after navigation, account changes or a newer request. */
export function useRequestGuard(userId?: string) {
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, [userId]);
  return useCallback(() => {
    const request = ++generation.current;
    return () => {
      const auth = useAuthStore.getState();
      return request === generation.current && !auth.isSigningOut
        && (!auth.isInitialized || auth.user?.id === userId);
    };
  }, [userId]);
}
