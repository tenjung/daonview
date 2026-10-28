import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertCampaignActor, CampaignActionError } from '@/lib/campaignActions';
import type { CampaignActionResult } from '@/lib/campaignActionTypes';

export async function requireCampaignActor(allowAdvertiser = false) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new CampaignActionError('인증이 필요합니다.', 401);
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('role').eq('id', user.id).maybeSingle();
  if (profileError || !profile) throw new CampaignActionError('사용자 권한을 확인할 수 없습니다.', 403);
  const actor = assertCampaignActor(user.id, profile.role, allowAdvertiser);
  return { actor, admin: createAdminClient() };
}

export function invalidateCampaignActions(results: CampaignActionResult[]): string | undefined {
  const applied = results.filter(result => result.campaign);
  if (!applied.length) return;
  try {
    revalidateTag('home-banner-data', 'max');
    for (const path of ['/', '/campaigns', '/dashboard/admin/campaigns', '/dashboard/advertiser/campaigns']) revalidatePath(path);
    for (const result of applied) {
      revalidatePath(`/campaigns/${result.id}`);
      revalidatePath(`/c/${result.id}`);
    }
  } catch {
    return '상태 변경은 반영됐으나 화면 캐시 갱신에 실패했습니다. 새로고침 후 확인해 주세요.';
  }
}
