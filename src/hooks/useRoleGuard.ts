'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  coerceDashboardRole,
  getRoleDashboardPath,
  type DashboardRoleKey,
} from '@/constants/role';

export function useRoleGuard(allowedRoles: DashboardRoleKey[], returnTo?: string) {
  const router = useRouter();
  const { user, profile, isLoading, isInitialized, isSigningOut, isProfileLoading, profileError } = useAuthStore();
  const role = coerceDashboardRole(profile?.role);

  const isChecking = isLoading || !isInitialized || isSigningOut || (!role && isProfileLoading);
  const isAllowed = Boolean(user && role && allowedRoles.includes(role));

  useEffect(() => {
    if (isChecking || profileError) return;

    if (!user) {
      router.replace(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login');
      return;
    }

    if (!role) {
      router.replace('/login');
      return;
    }

    if (!isAllowed) {
      router.replace(getRoleDashboardPath(role));
    }
  }, [isAllowed, isChecking, returnTo, role, router, user, profileError]);

  return {
    user,
    profile,
    role,
    isChecking,
    isAllowed: isAllowed && !profileError,
    profileError,
  };
}
