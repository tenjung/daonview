import { isAdminRole } from '@/constants/role';

export { isAdminRole };

export function normalizeRoleValue(role?: string | null): string {
  return String(role || '').toUpperCase();
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
  if (isAdminRole(normalizedRole)) return true;
  if (normalizedRole !== 'ADVERTISER') return false;
  return String(params.userId || '') !== '' && String(params.userId || '') === String(params.campaignCreatorId || '');
}
