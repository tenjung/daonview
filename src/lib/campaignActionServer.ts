import 'server-only';
import { invalidatePublicCampaigns } from '@/lib/campaignCache';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertCampaignActor, CampaignActionError } from '@/lib/campaignActions';
import type { CampaignActionResult } from '@/lib/campaignActionTypes';

export async function requireCampaignActor(allowAdvertiser = false) {
  const { user, profile, profileError } = await getRequestAuth();
  if (!user) throw new CampaignActionError('인증이 필요합니다.', 401);
  if (profileError || !profile) throw new CampaignActionError('사용자 권한을 확인할 수 없습니다.', 403);
  const actor = assertCampaignActor(user.id, profile.role || null, allowAdvertiser);
  return { actor, admin: createAdminClient() };
}

export function invalidateCampaignActions(results: CampaignActionResult[]): string | undefined {
  const applied = results.filter(result => result.campaign);
  if (!applied.length) return;
  return invalidatePublicCampaigns(applied.map(result => result.id));
}
