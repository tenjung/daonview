import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { canEditCampaign } from '@/lib/campaignPermissions';
import { invalidatePublicCampaigns } from '@/lib/campaignCache';

export async function POST(request: Request) {
  try {
    const { user, role, profileError, supabase } = await getRequestAuth();
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    if (profileError) return NextResponse.json({ error: profileError }, { status: 503 });
    const parsed = z.object({ campaignId: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: '잘못된 캠페인입니다.' }, { status: 400 });
    const id = parsed.data.campaignId;
    const existing = await supabase.from('campaigns').select('created_by').eq('id', id).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data || !canEditCampaign({ role, userId: user.id, campaignCreatorId: existing.data.created_by })) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }
    let query = supabase.from('campaigns').delete().eq('id', id);
    if (role !== 'ADMIN') query = query.eq('created_by', user.id);
    const result = await query.select('id');
    if (result.error) throw result.error;
    if (!result.data?.length) return NextResponse.json({ error: '삭제 결과가 변경되었습니다. 새로고침해 주세요.' }, { status: 409 });
    return NextResponse.json({ success: true, cacheWarning: invalidatePublicCampaigns([id]) });
  } catch {
    return NextResponse.json({ error: '삭제 결과를 확인하지 못했습니다. 목록을 새로 확인해 주세요.' }, { status: 500 });
  }
}
