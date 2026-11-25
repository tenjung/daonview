import type { Profile } from '@/types/database';

// Global navigation/onboarding state must not carry bank details or addresses.
const CLIENT_FIELDS = [
  'id', 'email', 'nickname', 'name', 'company_name', 'role', 'avatar_url',
  'phone_number', 'sns_url', 'blog_url', 'instagram_url', 'youtube_url', 'tiktok_url',
  'point', 'interests', 'preferred_platforms', 'preferred_regions',
  'biz_verification_status', 'email_subscription_status',
  'biz_number', 'biz_certificate_url', 'biz_verification_requested_at', 'biz_rejection_reason',
  'is_test_account',
] as const;

export function toClientProfile(profile: Profile | null): Profile | null {
  if (!profile) return null;
  const result: Profile = { id: profile.id };
  for (const field of CLIENT_FIELDS) {
    if (profile[field] !== undefined) (result as Record<string, unknown>)[field] = profile[field];
  }
  return result;
}
