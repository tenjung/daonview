import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { canEditCampaign } from '@/lib/campaignPermissions';
import { invalidatePublicCampaigns } from '@/lib/campaignCache';

const schema = z.object({
  campaignId: z.number().int().positive().optional(),
  intent: z.enum(['SAVE', 'DRAFT']).default('SAVE'),
  campaign: z.object({
    title: z.string().trim().min(1).max(500),
    type: z.enum(['VISIT', 'DELIVERY', 'PRESS', 'PURCHASE']),
    platform: z.enum(['BLOG', 'INSTAGRAM', 'PURCHASE', 'YOUTUBE', 'SHORTS', 'REELS', 'TIKTOK', 'OTHER']),
  }).catchall(z.unknown()),
});
const FIELDS = [
  'title', 'type', 'platform', 'brand_id', 'brand_name', 'product_name', 'category',
  'region', 'sub_region', 'recruitment_start_date', 'first_selection_date', 'end_date',
  'is_unlimited_recruitment', 'total_recruitment', 'campaign_images', 'campaign_image_variants',
  'thumbnail_url', 'experience_details', 'product_options', 'store_locations', 'option_config',
  'campaign_options', 'contact_method',
];
export async function POST(request: Request) {
  try {
    const { user, role, profileError, supabase } = await getRequestAuth();
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    if (profileError) return NextResponse.json({ error: profileError }, { status: 503 });
    if (role !== 'ADMIN' && role !== 'ADVERTISER') return NextResponse.json({ error: '등록 권한이 없습니다.' }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: '캠페인 입력값을 확인해 주세요.' }, { status: 400 });
    const { campaignId, campaign, intent } = parsed.data;
    const values = Object.fromEntries(FIELDS.filter(key => key in campaign).map(key => [key, campaign[key]]));
    if (intent === 'DRAFT') values.status = 'DRAFT';
    // User-scoped client keeps existing RLS/constraints in force; never accept owner/status from JSON.
    let result;
    if (campaignId) {
      const existing = await supabase.from('campaigns').select('created_by').eq('id', campaignId).maybeSingle();
      if (existing.error) throw new Error('소유권을 확인하지 못했습니다.');
      if (!existing.data || !canEditCampaign({ role, userId: user.id, campaignCreatorId: existing.data.created_by })) {
        return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
      }
      let query = supabase.from('campaigns').update(values).eq('id', campaignId);
      if (role !== 'ADMIN') query = query.eq('created_by', user.id);
      result = await query.select().single();
    } else {
      result = await supabase.from('campaigns').insert({ ...values, created_by: user.id, status: intent === 'DRAFT' ? 'DRAFT' : role === 'ADMIN' ? 'RECRUITING' : 'PENDING' }).select().single();
    }
    if (result.error || !result.data) throw new Error('캠페인을 저장하지 못했습니다.');
    return NextResponse.json({ campaign: result.data, cacheWarning: invalidatePublicCampaigns([result.data.id]) });
  } catch {
    return NextResponse.json({ error: '저장 결과를 확인하지 못했습니다. 재저장 전에 목록을 확인해 주세요.' }, { status: 500 });
  }
}
