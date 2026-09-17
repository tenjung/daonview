import { NextRequest, NextResponse } from 'next/server';

import { sendReviewSubmittedAlimtalk } from '@/lib/alimtalk';
import { isPurchaseReviewCampaign } from '@/lib/campaignPurchase';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface SubmitReviewBody {
  applicationId?: number;
  campaignId?: number;
  reviewUrl?: string;
  reviewContent?: string;
  mediaUrls?: string[];
  purchaseAmountProofUrl?: string;
  purchaseReviewProofUrl?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
}

const cleanText = (value: unknown, maxLength: number) => String(value || '').trim().slice(0, maxLength);

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const getAllowedUploadPrefix = (campaignId: number, userId: string) => {
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  return `${supabaseUrl}/storage/v1/object/public/files/reviews/${campaignId}/${userId}/`;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('bank_name, account_holder, account_number')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: '정산 정보를 불러오지 못했습니다.' }, { status: 500 });
  return NextResponse.json({
    payout: {
      bankName: profile?.bank_name || '',
      accountHolder: profile?.account_holder || '',
      accountNumber: profile?.account_number || '',
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  let body: SubmitReviewBody;
  try {
    body = await request.json() as SubmitReviewBody;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const applicationId = Number(body.applicationId);
  const campaignId = Number(body.campaignId);
  if (!Number.isInteger(applicationId) || !Number.isInteger(campaignId)) {
    return NextResponse.json({ error: '신청 또는 캠페인 정보가 올바르지 않습니다.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: application, error: applicationError } = await admin
    .from('applications')
    .select('id, user_id, campaign_id, status')
    .eq('id', applicationId)
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (applicationError) return NextResponse.json({ error: '신청 정보를 확인하지 못했습니다.' }, { status: 500 });
  if (!application || application.user_id !== user.id) {
    return NextResponse.json({ error: '해당 신청의 리뷰를 등록할 권한이 없습니다.' }, { status: 403 });
  }

  const applicationStatus = String(application.status || '').toUpperCase();
  if (!['SELECTED', 'APPROVED'].includes(applicationStatus)) {
    return NextResponse.json({ error: '선정된 캠페인만 리뷰를 등록할 수 있습니다.' }, { status: 409 });
  }

  const [{ data: campaign, error: campaignError }, { data: profile, error: profileError }] = await Promise.all([
    admin
      .from('campaigns')
      .select('id, title, created_by, type, platform, campaign_options')
      .eq('id', campaignId)
      .maybeSingle(),
    admin
      .from('profiles')
      .select('nickname, name, phone_number, bank_name, account_holder, account_number')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  if (campaignError || !campaign) return NextResponse.json({ error: '캠페인 정보를 확인하지 못했습니다.' }, { status: 500 });
  if (profileError || !profile) return NextResponse.json({ error: '프로필 정보를 확인하지 못했습니다.' }, { status: 500 });

  const { data: existingReview } = await admin
    .from('reviews')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (existingReview) return NextResponse.json({ error: '이미 리뷰를 등록한 캠페인입니다.' }, { status: 409 });

  const isPurchaseExperience = isPurchaseReviewCampaign(campaign);
  const reviewUrl = cleanText(body.reviewUrl, 2000);
  const reviewContent = cleanText(body.reviewContent, 5000);
  if (reviewUrl && !isHttpUrl(reviewUrl)) {
    return NextResponse.json({ error: '리뷰 주소는 http 또는 https로 시작해야 합니다.' }, { status: 400 });
  }
  if (!isPurchaseExperience && !reviewUrl) {
    return NextResponse.json({ error: '리뷰 주소를 입력해 주세요.' }, { status: 400 });
  }

  const allowedUploadPrefix = getAllowedUploadPrefix(campaignId, user.id);
  const requestedProofUrls = isPurchaseExperience
    ? [body.purchaseAmountProofUrl, body.purchaseReviewProofUrl]
    : Array.isArray(body.mediaUrls) ? body.mediaUrls.slice(0, 5) : [];
  const proofUrls = requestedProofUrls
    .map((value) => cleanText(value, 3000))
    .filter(Boolean);

  if (proofUrls.some((url) => !url.startsWith(allowedUploadPrefix))) {
    return NextResponse.json({ error: '이 캠페인에 직접 업로드한 증빙 파일만 등록할 수 있습니다.' }, { status: 400 });
  }
  if (isPurchaseExperience && proofUrls.length !== 2) {
    return NextResponse.json({ error: '구매금액과 구매평 증빙을 각각 등록해 주세요.' }, { status: 400 });
  }

  const bankName = cleanText(body.bankName, 50);
  const accountHolder = cleanText(body.accountHolder, 50);
  const accountNumber = cleanText(body.accountNumber, 100);
  if (isPurchaseExperience && (!bankName || !accountHolder || !accountNumber)) {
    return NextResponse.json({ error: '페이백을 받을 정산 계좌를 모두 입력해 주세요.' }, { status: 400 });
  }

  const previousPayout = {
    bank_name: profile.bank_name,
    account_holder: profile.account_holder,
    account_number: profile.account_number,
  };

  if (isPurchaseExperience) {
    const { error: payoutError } = await admin
      .from('profiles')
      .update({ bank_name: bankName, account_holder: accountHolder, account_number: accountNumber })
      .eq('id', user.id);
    if (payoutError) return NextResponse.json({ error: '정산 계좌를 저장하지 못했습니다.' }, { status: 500 });
  }

  const { data: review, error: reviewError } = await admin
    .from('reviews')
    .insert({
      user_id: user.id,
      campaign_id: campaignId,
      post_url: reviewUrl || 'PURCHASE_PROOF',
      description: reviewContent,
      thumbnail_url: proofUrls[0] || null,
      title: campaign.title,
      author_name: profile.nickname || profile.name || '인플루언서',
      status: 'PENDING',
      platform: isPurchaseExperience ? 'PURCHASE' : 'LINK',
    })
    .select('id')
    .single();

  if (reviewError || !review) {
    if (isPurchaseExperience) await admin.from('profiles').update(previousPayout).eq('id', user.id);
    return NextResponse.json({ error: '리뷰를 저장하지 못했습니다.' }, { status: 500 });
  }

  const { data: completedApplication, error: applicationUpdateError } = await admin
    .from('applications')
    .update({ status: 'COMPLETED', review_submitted: true, review_media_urls: proofUrls })
    .eq('id', applicationId)
    .in('status', ['SELECTED', 'APPROVED'])
    .select('id')
    .maybeSingle();

  if (applicationUpdateError || !completedApplication) {
    await admin.from('reviews').delete().eq('id', review.id);
    if (isPurchaseExperience) await admin.from('profiles').update(previousPayout).eq('id', user.id);
    return NextResponse.json({ error: '신청 완료 상태를 저장하지 못했습니다.' }, { status: 409 });
  }

  const influencerMessage = isPurchaseExperience
    ? `[${campaign.title}] 리뷰와 증빙이 등록되었습니다. 정상 확인 후 1~2영업일 내 입력한 계좌로 페이백이 진행됩니다.`
    : `[${campaign.title}] 캠페인 리뷰를 등록했습니다. 관리자 확인 후 절차가 진행됩니다.`;

  const notifications = [{
    user_id: user.id,
    type: 'CAMPAIGN_REVIEW_SUBMITTED',
    title: isPurchaseExperience ? '✅ 리뷰·증빙 등록 완료' : '✅ 리뷰 제출 완료',
    content: influencerMessage,
    link: '/dashboard/influencer/campaigns',
  }];

  if (campaign.created_by) {
    notifications.push({
      user_id: campaign.created_by,
      type: 'CAMPAIGN_REVIEW_RECEIVED',
      title: '📷 새로운 리뷰 도착',
      content: `[${campaign.title}] 캠페인에 새로운 리뷰가 제출되었습니다. 검토를 시작해 주세요.`,
      link: `/dashboard/advertiser/reviews?campaignId=${campaignId}`,
    });
  }
  await admin.from('notifications').insert(notifications);

  if (campaign.created_by) {
    const { data: advertiser } = await admin
      .from('profiles')
      .select('nickname, phone_number')
      .eq('id', campaign.created_by)
      .maybeSingle();
    if (advertiser?.phone_number) {
      try {
        await sendReviewSubmittedAlimtalk(
          advertiser.phone_number,
          advertiser.nickname || '광고주',
          campaign.title,
          profile.nickname || profile.name || '인플루언서',
          reviewUrl
        );
      } catch (error) {
        console.error('Review submitted alimtalk error:', error);
      }
    }
  }

  return NextResponse.json({ success: true, reviewId: review.id });
}

