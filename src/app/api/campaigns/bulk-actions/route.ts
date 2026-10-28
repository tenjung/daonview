import { NextResponse } from 'next/server';
import { applyCampaignActions, CampaignActionError, parseCampaignActionRequest } from '@/lib/campaignActions';
import { invalidateCampaignActions, requireCampaignActor } from '@/lib/campaignActionServer';

export async function POST(request: Request) {
  try {
    const { actor, admin } = await requireCampaignActor();
    let body: unknown;
    try { body = await request.json(); }
    catch { throw new CampaignActionError('올바른 JSON 요청이 필요합니다.'); }
    const { action, campaignIds } = parseCampaignActionRequest(body);
    const results = await applyCampaignActions(admin, actor, action, campaignIds);
    const cacheWarning = invalidateCampaignActions(results);
    return NextResponse.json({ results, cacheWarning });
  } catch (error) {
    return NextResponse.json({ error: error instanceof CampaignActionError ? error.message : '캠페인 처리 중 서버 오류가 발생했습니다.' },
      { status: error instanceof CampaignActionError ? error.statusCode : 500 });
  }
}
