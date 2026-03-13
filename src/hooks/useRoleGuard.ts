'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  coerceDashboardRole,
  getRoleDashboardPath,
  type DashboardRoleKey,
} from '@/constants/role';

export function useRoleGuard(allowedRoles: DashboardRoleKey[]) {
  const router = useRouter();
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const role = coerceDashboardRole(profile?.role || user?.user_metadata?.role);

  useEffect(() => {
    if (isLoading || !isInitialized) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!role) {
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.replace(getRoleDashboardPath(role));
    }
  }, [allowedRoles, isInitialized, isLoading, role, router, user]);

  return {
    user,
    profile,
    role,
    isChecking: isLoading || !isInitialized,
    isAllowed: Boolean(user && role && allowedRoles.includes(role)),
  };
}
