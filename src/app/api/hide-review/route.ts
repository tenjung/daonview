import { NextRequest, NextResponse } from 'next/server';

import { sendEmail } from '@/lib/email';
import { isPurchaseReviewCampaign } from '@/lib/campaignPurchase';
import type { ReviewEmailNotification } from '@/types/reviewManagement';
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
      admin.from('reviews').select('id, user_id, campaign_id, status').eq('id', reviewId).maybeSingle(),
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

    const previousStatus = String(review.status || '').toUpperCase();
    if (previousStatus === status) {
      return NextResponse.json({ success: true, emailNotification: { status: 'NOT_REQUIRED' } });
    }

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

    // 읽은 상태가 그대로인 경우에만 갱신하여 동시 승인 중 한 요청만 발송한다.
    let updateQuery = admin.from('reviews').update(updatePayload).eq('id', reviewId);
    updateQuery = review.status == null
      ? updateQuery.is('status', null)
      : updateQuery.eq('status', review.status);
    const { data: updatedReview, error: updateError } = await updateQuery.select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!updatedReview) {
      return NextResponse.json({ error: '다른 요청에서 리뷰 상태가 변경되었습니다. 새로고침 후 확인해 주세요.' }, { status: 409 });
    }

    let emailNotification: ReviewEmailNotification = { status: 'NOT_REQUIRED' };
    if (status === 'APPROVED' && previousStatus === 'PENDING') {
      try {
        const [profileResult, campaignResult] = await Promise.all([
          review.user_id
            ? admin.from('profiles').select('email, nickname, name').eq('id', review.user_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          review.campaign_id
            ? admin.from('campaigns').select('title, type, platform, campaign_options').eq('id', review.campaign_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (profileResult.error || campaignResult.error) throw new Error('Approval email recipient or campaign lookup failed');
        const influencer = profileResult.data;
        const campaign = campaignResult.data;
        if (!influencer?.email?.trim()) {
          emailNotification = { status: 'SKIPPED', message: '리뷰어 이메일이 없어 승인 메일을 보내지 못했습니다.' };
        } else if (!campaign) {
          emailNotification = { status: 'FAILED', message: '캠페인 정보를 찾지 못해 승인 메일을 보내지 못했습니다.' };
        } else {
          const result = await sendEmail(influencer.email.trim(), 'REVIEW_APPROVED', {
            nickname: influencer.nickname || influencer.name || '인플루언서',
            campaignTitle: campaign.title,
            isPurchaseReview: isPurchaseReviewCampaign(campaign),
          });
          emailNotification = result.success
            ? result.mock
              ? { status: 'MOCK', message: '모의 발송 환경으로 실제 승인 메일은 발송되지 않았습니다.' }
              : { status: 'SENT', message: '승인 메일 발송 요청이 완료되었습니다.' }
            : { status: result.skipped ? 'SKIPPED' : 'FAILED', message: '수신거부 또는 메일 수신 제한으로 승인 메일이 발송되지 않았습니다.' };
        }
      } catch {
        console.error('Review approval email failed', { reviewId });
        emailNotification = { status: 'FAILED', message: '승인 메일 발송에 실패했습니다.' };
      }
    }

    return NextResponse.json({ success: true, emailNotification });
  } catch (error) {
    console.error('Review status update error:', error);
    return NextResponse.json({ error: '리뷰 상태 변경에 실패했습니다.' }, { status: 500 });
  }
}
