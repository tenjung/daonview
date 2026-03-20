export const ADMIN_ROLE_ALIASES = ['ADMIN', 'MASTER', 'SUPER_ADMIN'] as const;

export function normalizeRoleValue(role?: string | null): string {
  return String(role || '').toUpperCase();
}

export function isAdminRole(role?: string | null): boolean {
  return ADMIN_ROLE_ALIASES.includes(normalizeRoleValue(role) as (typeof ADMIN_ROLE_ALIASES)[number]);
}

export function isAdvertiserRole(role?: string | null): boolean {
  return normalizeRoleValue(role) === 'ADVERTISER';
}

export function canEditCampaign(params: {
  role?: string | null;
  userId?: string | null;
  campaignCreatorId?: string | number | null;
}): boolean {
  const normalizedRole = normalizeRoleValue(params.role);
  if (ADMIN_ROLE_ALIASES.includes(normalizedRole as (typeof ADMIN_ROLE_ALIASES)[number])) return true;
  if (normalizedRole !== 'ADVERTISER') return false;
  return String(params.userId || '') !== '' && String(params.userId || '') === String(params.campaignCreatorId || '');
}
