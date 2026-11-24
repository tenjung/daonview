import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidatePublicCampaigns } from '@/lib/campaignCache';
import { withRelationCounts } from '@/lib/publicCampaignDto';
import { getCampaignRecruitTarget, isCampaignOpenForApplications, resolveCampaignPlatformState } from '@/lib/campaignUtils';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('APPLY'), campaignId: z.number().int().positive(), selectedOption: z.string().max(5000).nullable(), message: z.string().max(10000).nullable() }),
  z.object({ action: z.literal('CANCEL'), campaignId: z.number().int().positive().optional(), applicationId: z.number().int().positive().optional() })
    .refine(value => value.campaignId || value.applicationId),
]);
export async function POST(request: Request) {
  try {
    const { user, profile, role, profileError, supabase } = await getRequestAuth();
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    if (profileError) return NextResponse.json({ error: profileError }, { status: 503 });
    if (!role || !profile) return NextResponse.json({ error: '사용자 권한을 확인할 수 없습니다.' }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: '신청 정보를 확인해 주세요.' }, { status: 400 });
    const body = parsed.data;
    if (body.action === 'CANCEL') {
      let lookup = supabase.from('applications').select('id,campaign_id,status').eq('user_id', user.id);
      lookup = body.applicationId ? lookup.eq('id', body.applicationId) : lookup.eq('campaign_id', body.campaignId!);
      const existing = await lookup.order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (existing.error) throw new Error('신청을 조회하지 못했습니다.');
      if (!existing.data) return NextResponse.json({ error: '신청 내역을 찾을 수 없습니다.' }, { status: 404 });
      if (String(existing.data.status).toUpperCase() !== 'PENDING') return NextResponse.json({ error: '심사중인 신청만 취소할 수 있습니다.' }, { status: 409 });
      const result = await supabase.from('applications').delete().eq('id', existing.data.id).eq('user_id', user.id).eq('status', 'PENDING').select('id');
      if (result.error) throw new Error('취소에 실패했습니다.');
      if (!result.data?.length) return NextResponse.json({ error: '신청 상태가 변경되었습니다. 새로고침해 주세요.' }, { status: 409 });
      return NextResponse.json({ success: true, cacheWarning: invalidatePublicCampaigns([existing.data.campaign_id]) });
    }
    if (role !== 'INFLUENCER') return NextResponse.json({ error: '인플루언서 계정만 캠페인에 신청할 수 있습니다.' }, { status: 403 });
    // 선정 인원은 RLS(본인 신청만 보임)에 영향받지 않는 DB 계산 컬럼(selected_count)으로 판정한다.
    const campaignResult = await supabase.from('campaigns').select('*, applicant_count, selected_count').eq('id', body.campaignId).maybeSingle();
    if (campaignResult.error) throw new Error('캠페인을 조회하지 못했습니다.');
    const campaign = campaignResult.data ? withRelationCounts(campaignResult.data) : null;
    if (!campaign || !isCampaignOpenForApplications(campaign)) return NextResponse.json({ error: '현재 신청 가능한 캠페인이 아닙니다.' }, { status: 409 });
    const options = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
    const flags = resolveCampaignPlatformState({ type: campaign.type, platform: campaign.platform, step1Data: options?.step1Data || {} });
    if (!profile.phone_number || profile.phone_number.trim().length < 10) return NextResponse.json({ error: '연락처를 등록해 주세요.' }, { status: 400 });
    const purchase = flags.normalizedType === 'PURCHASE' || (flags.normalizedType === 'DELIVERY' && flags.includeReview);
    if (flags.normalizedType === 'DELIVERY' && !purchase && (!profile.name || !profile.zip_code || !profile.address_base || !profile.address_detail)) {
      return NextResponse.json({ error: '배송지를 등록해 주세요.' }, { status: 400 });
    }
    const needsBlog = flags.includeNaver || (!flags.includeNaver && !flags.includeInstagram && flags.resolvedPlatform === 'BLOG');
    const needsInstagram = flags.includeInstagram || (!flags.includeNaver && !flags.includeInstagram && flags.resolvedPlatform === 'INSTAGRAM');
    if ((needsBlog && !profile.blog_url && !profile.sns_url) || (needsInstagram && !profile.instagram_url)) return NextResponse.json({ error: '캠페인에 필요한 SNS를 등록해 주세요.' }, { status: 400 });
    const inserted = await supabase.from('applications').insert({ user_id: user.id, campaign_id: body.campaignId, status: 'PENDING', selected_option: body.selectedOption, application_message: body.message }).select('id').single();
    if (inserted.error?.code === '23505') return NextResponse.json({ error: '이미 신청한 캠페인입니다.' }, { status: 409 });
    if (inserted.error || !inserted.data) throw new Error('신청 결과를 확인하지 못했습니다.');
    const cacheWarning = invalidatePublicCampaigns([body.campaignId]);
    // Preserve the existing exact-count milestone notification, without retrying the application.
    let notificationWarning: string | undefined;
    try {
      // 사용자 세션의 applications count는 RLS로 본인 신청만 세므로, 신청 저장 후 계산 컬럼(applicant_count)을 다시 읽는다.
      const latest = await supabase.from('campaigns').select('applicant_count').eq('id', body.campaignId).maybeSingle();
      if (latest.error) throw latest.error;
      const rawCount = latest.data?.applicant_count;
      const count = typeof rawCount === 'number' ? rawCount : typeof rawCount === 'string' && rawCount.trim() !== '' ? Number(rawCount) : null;
      const target = getCampaignRecruitTarget(campaign);
      if (count !== null && Number.isFinite(count) && target && campaign.created_by) {
        const percent = [50, 100, 120].find(value => Math.floor(target * value / 100) === count);
        if (percent) {
          // notifications INSERT는 관리자 정책만 허용하므로, 신청 저장 후 서버 권한으로 광고주 알림만 생성한다.
          const { error: noticeError } = await createAdminClient().from('notifications').insert({ user_id: campaign.created_by, type: 'CAMPAIGN_MILESTONE', title: `📈 모집 현황 ${percent}% 달성`, content: percent === 120 ? `[${campaign.title}] 캠페인 모집 인원이 정원의 ${percent}%를 초과했습니다! 🔥` : `[${campaign.title}] 캠페인 모집 인원이 정원의 ${percent}%를 달성했습니다! 🎉`, link: `/dashboard/advertiser/applicants?campaignId=${body.campaignId}` });
          if (noticeError) throw noticeError;
        }
      }
    } catch { notificationWarning = '신청은 완료됐으나 운영 알림 생성에 실패했습니다.'; }
    return NextResponse.json({ success: true, applicationId: inserted.data.id, cacheWarning, notificationWarning });
  } catch {
    return NextResponse.json({ error: '처리 결과를 확인하지 못했습니다. 다시 신청하기 전에 내 신청 내역을 확인해 주세요.' }, { status: 500 });
  }
}
