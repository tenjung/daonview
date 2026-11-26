import 'server-only';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, canEditCampaign } from '@/lib/campaignPermissions';
import { normalizeSelectionEmailHold, isSelectedApplication, SELECTION_KAKAO_STATUS_LABELS, type SelectionKakaoStatus } from '@/lib/selectionEmailHold';
import type { ApplicationKakaoDelivery } from '@/lib/selectionPreview';

export class EmailHoldAccessError extends Error {
  constructor(public status: number) { super('Email hold access denied'); }
}
export async function authorizeEmailHoldAccess(campaignId: number, adminOnly = false) {
  const { user, profile, profileError } = await getRequestAuth();
  if (!user) throw new EmailHoldAccessError(401);
  if (profileError) throw new EmailHoldAccessError(503);
  if (!profile) throw new EmailHoldAccessError(403);
  const isAdmin = isAdminRole(profile.role);
  if (adminOnly && !isAdmin) throw new EmailHoldAccessError(403);
  const admin = createAdminClient();
  const { data: campaign, error } = await admin.from('campaigns').select('created_by').eq('id', campaignId).maybeSingle();
  if (error) throw new Error('Campaign lookup failed');
  if (!campaign) throw new EmailHoldAccessError(404);
  if (!canEditCampaign({ role: profile.role, userId: user.id, campaignCreatorId: campaign.created_by })) throw new EmailHoldAccessError(403);
  return { admin, userId: user.id, canResolve: isAdmin };
}
export async function getCampaignEmailHolds(campaignId: number) {
  const { admin, canResolve } = await authorizeEmailHoldAccess(campaignId);
  const holds = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin.from('selection_email_holds')
      .select('id,application_id,feedback:email_feedback_events(recipient,reason,occurred_at,smtp_status),kakao:selection_kakao_deliveries(id,status,created_at,completed_at),application:applications!inner(campaign_id,status)')
      .eq('application.campaign_id', campaignId).is('resolved_at', null).order('id').range(offset, offset + 499);
    if (error) throw new Error('보류 내역을 불러오지 못했습니다.');
    for (const row of data || []) {
      const application = row.application as unknown as { status: string };
      if (isSelectedApplication(application.status)) holds.push(normalizeSelectionEmailHold(row));
    }
    if (!data || data.length < 500) break;
  }
  return { holds, kakaoDeliveries: await getCampaignKakaoDeliveries(admin, campaignId), canResolve };
}

/** 신청자 표 카톡 칸: 신청별 최신 선정 안내 알림톡 상태(보류 여부와 무관). */
async function getCampaignKakaoDeliveries(admin: ReturnType<typeof createAdminClient>, campaignId: number) {
  const latest = new Map<number, ApplicationKakaoDelivery>();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin.from('selection_kakao_deliveries')
      .select('id,application_id,status,created_at,completed_at,application:applications!inner(campaign_id)')
      .eq('application.campaign_id', campaignId).order('id', { ascending: false }).range(offset, offset + 499);
    if (error) throw new Error('카톡 발송 내역을 불러오지 못했습니다.');
    for (const row of data || []) {
      if (latest.has(row.application_id)) continue;
      const status = String(row.status || '').toUpperCase();
      latest.set(row.application_id, {
        applicationId: row.application_id,
        status: status in SELECTION_KAKAO_STATUS_LABELS ? status as SelectionKakaoStatus : 'UNKNOWN',
        at: row.completed_at || row.created_at,
      });
    }
    if (!data || data.length < 500) break;
  }
  return [...latest.values()];
}
