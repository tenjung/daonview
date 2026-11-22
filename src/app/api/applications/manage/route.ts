import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { canEditCampaign } from '@/lib/campaignPermissions';
import { invalidatePublicCampaigns } from '@/lib/campaignCache';

const schema = z.object({ ids: z.array(z.number().int().positive()).min(1).max(500), status: z.enum(['REJECTED', 'CANCELLED']), reason: z.string().trim().max(2000).optional() }).refine(value => value.status !== 'CANCELLED' || Boolean(value.reason), { message: '취소 사유가 필요합니다.' });
export async function POST(request: Request) {
  try {
    const { user, profile, role, profileError, supabase } = await getRequestAuth();
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    if (profileError) return NextResponse.json({ error: profileError }, { status: 503 });
    if (role !== 'ADMIN' && role !== 'ADVERTISER') return NextResponse.json({ error: '처리 권한이 없습니다.' }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: '처리 정보를 확인해 주세요.' }, { status: 400 });
    const { ids, status, reason } = parsed.data;
    const found = await supabase.from('applications').select('id,campaign_id,campaigns(created_by)').in('id', ids);
    if (found.error) throw new Error('조회 실패');
    if (!found.data || found.data.length !== new Set(ids).size) return NextResponse.json({ error: '신청 내역을 확인할 수 없습니다.' }, { status: 404 });
    for (const row of found.data) {
      const campaign = (Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns) as { created_by?: string } | null;
      if (!canEditCampaign({ role: profile?.role, userId: user.id, campaignCreatorId: campaign?.created_by })) return NextResponse.json({ error: '처리 권한이 없습니다.' }, { status: 403 });
    }
    // RLS does not grant advertiser-owner updates. Elevate only after checking every target owner.
    const campaignIds = [...new Set(found.data.map(row => row.campaign_id))];
    const result = await createAdminClient().from('applications').update(status === 'CANCELLED'
      ? { status, cancellation_reason: reason || '', cancelled_at: new Date().toISOString() } : { status }).in('id', ids).in('campaign_id', campaignIds).select('id');
    if (result.error || result.data?.length !== new Set(ids).size) throw new Error('처리 결과 확인 실패');
    return NextResponse.json({ success: true, cacheWarning: invalidatePublicCampaigns(campaignIds) });
  } catch {
    return NextResponse.json({ error: '처리 결과를 확인하지 못했습니다. 재시도 전에 목록을 확인해 주세요.' }, { status: 500 });
  }
}
