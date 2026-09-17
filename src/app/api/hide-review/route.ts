import { NextRequest, NextResponse } from 'next/server';

import { sendReviewApprovedAlimtalk } from '@/lib/alimtalk';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_STATUSES = ['APPROVED', 'HIDDEN', 'PENDING', 'REJECTED'] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const body = await request.json() as { reviewId?: number; status?: string };
    const reviewId = Number(body.reviewId);
    const status = String(body.status || '').toUpperCase();
    if (!Number.isInteger(reviewId) || !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
      return NextResponse.json({ error: '리뷰 번호 또는 상태가 올바르지 않습니다.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const [{ data: actor }, { data: review, error: reviewError }] = await Promise.all([
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      admin.from('reviews').select('id, user_id, campaign_id, title').eq('id', reviewId).maybeSingle(),
    ]);
    if (reviewError || !review) return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });

    const role = normalizeRoleValue(actor?.role);
    let authorized = isAdminRole(role);
    if (!authorized && role === 'ADVERTISER' && review.campaign_id) {
      const { data: ownedCampaign } = await admin
        .from('campaigns')
        .select('id')
        .eq('id', review.campaign_id)
        .eq('created_by', user.id)
        .maybeSingle();
      authorized = Boolean(ownedCampaign);
    }
    if (!authorized) return NextResponse.json({ error: '리뷰 상태를 변경할 권한이 없습니다.' }, { status: 403 });

    const updatePayload: Record<string, string | null> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'APPROVED') {
      updatePayload.approved_at = new Date().toISOString();
      updatePayload.approved_by = user.id;
    } else {
      updatePayload.approved_at = null;
      updatePayload.approved_by = null;
    }

    const { error: updateError } = await admin.from('reviews').update(updatePayload).eq('id', reviewId);
    if (updateError) throw updateError;

    if (status === 'APPROVED' && review.user_id) {
      const { data: influencer } = await admin
        .from('profiles')
        .select('phone_number, nickname, name')
        .eq('id', review.user_id)
        .maybeSingle();
      if (influencer?.phone_number) {
        try {
          await sendReviewApprovedAlimtalk(
            influencer.phone_number,
            influencer.nickname || influencer.name || '인플루언서',
            review.title || '캠페인 리뷰'
          );
        } catch (error) {
          console.error('Review approval alimtalk error:', error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review status update error:', error);
    return NextResponse.json({ error: '리뷰 상태 변경에 실패했습니다.' }, { status: 500 });
  }
}
