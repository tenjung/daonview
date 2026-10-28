import { NextResponse } from 'next/server';
import { applyCampaignAction, CampaignActionError } from '@/lib/campaignActions';
import { invalidateCampaignActions, requireCampaignActor } from '@/lib/campaignActionServer';

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const campaignId = Number(id);
    if (!Number.isSafeInteger(campaignId) || campaignId <= 0) {
      throw new CampaignActionError('유효하지 않은 캠페인 ID입니다.');
    }
    const { actor, admin } = await requireCampaignActor(true);
    const result = await applyCampaignAction(admin, actor, 'CLOSE', campaignId);
    if (!result.campaign) {
      return NextResponse.json({ error: result.message }, { status: result.httpStatus || 500 });
    }
    const cacheWarning = invalidateCampaignActions([result]);
    return NextResponse.json({ success: true, campaign: result.campaign, cacheWarning });
  } catch (error) {
    return NextResponse.json({ error: error instanceof CampaignActionError ? error.message : '캠페인 마감 중 서버 오류가 발생했습니다.' },
      { status: error instanceof CampaignActionError ? error.statusCode : 500 });
  }
}
