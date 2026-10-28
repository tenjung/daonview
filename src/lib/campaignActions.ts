import type { SupabaseClient } from '@supabase/supabase-js';
import type { CampaignAction, CampaignActionCampaign, CampaignActionResult } from './campaignActionTypes';

export class CampaignActionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'CampaignActionError';
    this.statusCode = statusCode;
  }
}

export function assertCampaignActor(userId: string | null, role: string | null, allowAdvertiser = false) {
  if (!userId) throw new CampaignActionError('인증이 필요합니다.', 401);
  const normalized = (role || '').toUpperCase();
  if (!['ADMIN', 'MASTER', 'SUPER_ADMIN'].includes(normalized) && !(allowAdvertiser && normalized === 'ADVERTISER')) {
    throw new CampaignActionError('캠페인을 처리할 권한이 없습니다.', 403);
  }
  return { userId, role: normalized };
}

export function parseCampaignActionRequest(value: unknown): { action: CampaignAction; campaignIds: number[] } {
  if (!value || typeof value !== 'object') throw new CampaignActionError('잘못된 요청입니다.');
  const { action, campaignIds } = value as Record<string, unknown>;
  if (action !== 'APPROVE' && action !== 'REJECT' && action !== 'CLOSE') {
    throw new CampaignActionError('유효하지 않은 작업입니다.');
  }
  if (!Array.isArray(campaignIds) || campaignIds.length === 0 || campaignIds.length > 100 ||
      campaignIds.some(id => typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) ||
      new Set(campaignIds).size !== campaignIds.length) {
    throw new CampaignActionError('캠페인 ID는 중복 없이 1~100개의 양의 정수여야 합니다.');
  }
  return { action, campaignIds };
}

export function campaignCloseEndDate(endDate: string | null, now = new Date()) {
  const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return endDate && endDate < today ? endDate : today;
}

interface CampaignActor { userId: string; role: string }
type StoredCampaign = Omit<CampaignActionCampaign, 'status'> & { status: string; created_by: string | null };

// The status predicate claims the transition before payment/notification side effects.
// A repeated or concurrent request cannot send the approval notification twice.
export async function applyCampaignAction(
  admin: SupabaseClient,
  actor: CampaignActor,
  action: CampaignAction,
  id: number,
): Promise<CampaignActionResult> {
  let title: string | undefined;
  let applied: CampaignActionCampaign | undefined;
  const warnings: string[] = [];
  try {
    assertCampaignActor(actor.userId, actor.role, action === 'CLOSE');
    const { data, error } = await admin.from('campaigns')
      .select('id, title, status, end_date, created_by').eq('id', id).maybeSingle();
    if (error) return { id, outcome: 'FAILED', message: '캠페인 조회에 실패했습니다.', httpStatus: 500 };
    if (!data) return { id, outcome: 'FAILED', message: '캠페인을 찾을 수 없습니다.', httpStatus: 404 };
    const campaign = data as StoredCampaign;
    title = campaign.title;
    if (actor.role.toUpperCase() === 'ADVERTISER' && campaign.created_by !== actor.userId) {
      return { id, title, outcome: 'FAILED', message: '본인 캠페인만 마감할 수 있습니다.', httpStatus: 403 };
    }
    const status = campaign.status.toUpperCase();
    const allowed = action === 'CLOSE' ? ['RECRUITING', 'ONGOING'] : ['PENDING'];
    if (!allowed.includes(status)) {
      return { id, title, outcome: 'SKIPPED', message: '현재 상태에서는 이 작업을 실행할 수 없습니다.', httpStatus: 409 };
    }
    const changes = action === 'CLOSE'
      ? { status: 'COMPLETED', end_date: campaignCloseEndDate(campaign.end_date) }
      : { status: action === 'APPROVE' ? 'RECRUITING' : 'REJECTED' };
    const { data: updated, error: updateError } = await admin.from('campaigns').update(changes)
      .eq('id', id).eq('status', campaign.status).select('id, title, status, end_date').maybeSingle();
    if (updateError) return { id, title, outcome: 'FAILED', message: '캠페인 변경에 실패했습니다.', httpStatus: 500 };
    if (!updated) return { id, title, outcome: 'SKIPPED', message: '다른 작업으로 상태가 변경되었습니다. 목록을 확인해 주세요.', httpStatus: 409 };
    applied = updated as CampaignActionCampaign;
    if (action === 'APPROVE') {
      try {
        const { error: paymentError } = await admin.from('payments')
          .update({ status: 'PAID', updated_at: new Date().toISOString() })
          .eq('campaign_id', id).eq('status', 'PENDING');
        if (paymentError) warnings.push('승인은 반영됐으나 결제 확정에 실패했습니다. 결제 관리에서 확인해 주세요.');
      } catch {
        warnings.push('승인은 반영됐으나 결제 확정 결과를 확인할 수 없습니다. 결제 관리에서 확인해 주세요.');
      }
      if (campaign.created_by) {
        try {
          const { error: notificationError } = await admin.from('notifications').insert({
            user_id: campaign.created_by, type: 'CAMPAIGN_APPROVED', title: '캠페인 승인 완료',
            content: `"${campaign.title}" 캠페인이 승인되어 모집이 시작되었습니다.`,
            link: '/dashboard/advertiser/campaigns',
          });
          if (notificationError) warnings.push('승인은 반영됐으나 승인 알림 생성에 실패했습니다.');
        } catch {
          warnings.push('승인은 반영됐으나 승인 알림 생성 결과를 확인할 수 없습니다.');
        }
      }
    }
    return { id, title, outcome: warnings.length ? 'WARNING' : 'SUCCESS', message: warnings.length ? '상태 변경 완료, 연동 확인 필요' : '처리 완료', warnings, campaign: applied };
  } catch (error) {
    // A transport failure may happen after the database accepted the update: never retry automatically.
    return { id, title, outcome: applied ? 'WARNING' : 'FAILED', campaign: applied,
      message: error instanceof CampaignActionError ? error.message : '처리 결과를 확인할 수 없습니다. 목록을 새로 확인해 주세요.',
      httpStatus: error instanceof CampaignActionError ? error.statusCode : 500 };
  }
}

export async function applyCampaignActions(admin: SupabaseClient, actor: CampaignActor, action: CampaignAction, ids: number[]) {
  const results: CampaignActionResult[] = [];
  for (const id of ids) results.push(await applyCampaignAction(admin, actor, action, id));
  return results;
}
