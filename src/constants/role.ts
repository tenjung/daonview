export const USER_ROLES = {
  ADMIN: 'ADMIN',
  ADVERTISER: 'ADVERTISER',
  INFLUENCER: 'INFLUENCER',
} as const;

export type UserRoleKey = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type DashboardRoleKey = UserRoleKey;

export function normalizeRole(role?: string | null) {
  return (role || '').toUpperCase();
}

export function isRole(role: string | null | undefined, target: UserRoleKey) {
  return normalizeRole(role) === target;
}

/**
 * 관리자 판정 단일 기준. DB profiles_role_check와 is_admin()이 ADMIN만 허용하므로 별칭을 두지 않는다.
 */
export function isAdminRole(role?: string | null) {
  return normalizeRole(role) === USER_ROLES.ADMIN;
}

export function coerceDashboardRole(role?: string | null): DashboardRoleKey | null {
  const normalizedRole = normalizeRole(role);

  if (isAdminRole(normalizedRole)) return USER_ROLES.ADMIN;
  if (normalizedRole === USER_ROLES.ADVERTISER) return USER_ROLES.ADVERTISER;
  if (normalizedRole === USER_ROLES.INFLUENCER) return USER_ROLES.INFLUENCER;

  return null;
}

export function getRoleLabel(role?: string | null) {
  switch (coerceDashboardRole(role)) {
    case USER_ROLES.ADMIN:
      return '관리자';
    case USER_ROLES.ADVERTISER:
      return '광고주';
    case USER_ROLES.INFLUENCER:
      return '인플루언서';
    default:
      return '사용자';
  }
}

export function getRoleDashboardPath(role?: string | null) {
  switch (coerceDashboardRole(role)) {
    case USER_ROLES.ADMIN:
      return '/dashboard/admin';
    case USER_ROLES.ADVERTISER:
      return '/dashboard/advertiser';
    case USER_ROLES.INFLUENCER:
      return '/dashboard/influencer';
    default:
      return '/dashboard/influencer';
  }
}
