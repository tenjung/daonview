import { NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { invalidatePublicCampaigns } from '@/lib/campaignCache';
import { canEditCampaign } from '@/lib/campaignPermissions';

export async function POST(request: Request) {
  try {
    const { user, role, profileError, supabase } = await getRequestAuth();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (profileError) return NextResponse.json({ error: profileError }, { status: 503 });
    const body = await request.json().catch(() => ({}));
    const id = body?.campaignId;
    if (id !== undefined && (!/^\d+$/.test(String(id)) || Number(id) < 1)) return NextResponse.json({ error: 'INVALID_CAMPAIGN' }, { status: 400 });
    if (role !== 'ADMIN') {
      if (!id || role !== 'ADVERTISER') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      const result = await supabase.from('campaigns').select('created_by').eq('id', id).maybeSingle();
      if (result.error) throw result.error;
      if (!result.data || !canEditCampaign({ userId: user.id, role, campaignCreatorId: result.data.created_by })) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const cacheWarning = invalidatePublicCampaigns(id ? [id] : []);
    return NextResponse.json({ success: !cacheWarning, cacheWarning });
  } catch {
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
