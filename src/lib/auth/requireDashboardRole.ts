import { redirect } from 'next/navigation';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import {
  getRoleDashboardPath,
  type DashboardRoleKey,
} from '@/constants/role';

interface RequireDashboardRoleResult {
  userId: string;
  role: DashboardRoleKey;
}

export async function requireDashboardRole(
  requiredRole: DashboardRoleKey
): Promise<RequireDashboardRoleResult> {
  return requireDashboardRoles([requiredRole]);
}

export async function requireDashboardRoles(requiredRoles: DashboardRoleKey[]): Promise<RequireDashboardRoleResult> {
  const { user, role: normalizedRole, profileError } = await getRequestAuth();

  if (!user) {
    redirect('/login');
  }

  if (profileError) throw new Error(profileError);
  if (!normalizedRole) {
    throw new Error('사용자 권한을 확인할 수 없습니다.');
  }

  if (!requiredRoles.includes(normalizedRole)) {
    redirect(getRoleDashboardPath(normalizedRole));
  }

  return {
    userId: user.id,
    role: normalizedRole,
  };
}
