import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    let campaignId: string | null = null;
    try {
      const body = await request.json();
      const rawCampaignId = body?.campaignId;
      if (rawCampaignId !== undefined && rawCampaignId !== null) {
        campaignId = String(rawCampaignId);
      }
    } catch {
      // JSON body is optional.
    }

    revalidateTag('home-banner-data', 'max');
    revalidatePath('/');
    revalidatePath('/campaigns');

    if (campaignId && campaignId.trim() !== '') {
      revalidatePath(`/campaigns/${campaignId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[revalidate-home-banner] error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
