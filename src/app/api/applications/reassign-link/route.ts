import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { extractOptionCandidates, normalizeOptionKey, normalizeOptionLabel } from '@/lib/purchaseLink';
import { sendSelectionNotification } from '@/lib/applicationSelectionNotification';

interface ReassignLinkBody {
  applicationId?: number;
  campaignId?: number;
  assignedOptionLabel?: string;
  manualLinkId?: number | null;
  manualPurchaseLinkUrl?: string | null;
}

interface CampaignOptionsPayload {
  step1Data?: {
    productUrlIndividual?: boolean;
    productName?: string;
  };
}

function formatDeadlineDate(rawValue?: string | null): string {
  if (!rawValue) return '캠페인 상세 페이지 참조';
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return '캠페인 상세 페이지 참조';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function normalizePurchaseLinkUrl(value?: string | null) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return /^https?:\/\//i.test(normalized) ? normalized : '';
}

function isDefaultOptionLabel(label: string) {
  return normalizeOptionKey(label) === normalizeOptionKey('기본 옵션');
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as ReassignLinkBody;
    const applicationId = Number(body.applicationId);
    const campaignId = Number(body.campaignId);
    const manualLinkIdRaw = body.manualLinkId;
    let manualLinkId = manualLinkIdRaw == null ? null : Number(manualLinkIdRaw);
    const manualPurchaseLinkUrl = normalizePurchaseLinkUrl(body.manualPurchaseLinkUrl);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 applicationId 입니다.' }, { status: 400 });
    }

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 campaignId 입니다.' }, { status: 400 });
    }

    if (manualLinkIdRaw != null) {
      const parsedManualLinkId = Number(manualLinkIdRaw);
      if (!Number.isInteger(parsedManualLinkId) || parsedManualLinkId <= 0) {
        return NextResponse.json({ error: 'manualLinkId는 양의 정수여야 합니다.' }, { status: 400 });
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '사용자 권한을 확인할 수 없습니다.' }, { status: 403 });
    }

    const role = normalizeRoleValue(profile.role);
    const isAdmin = isAdminRole(role);

    const { data: campaign, error: campaignError } = await admin
      .from('campaigns')
      .select('id, title, created_by, end_date, experience_details, product_name, campaign_options')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!isAdmin && campaign.created_by !== user.id) {
      return NextResponse.json({ error: '링크 재할당 권한이 없습니다.' }, { status: 403 });
    }

    const { data: application, error: applicationError } = await admin
      .from('applications')
      .select('id, campaign_id, user_id, status, selected_option')
      .eq('id', applicationId)
      .eq('campaign_id', campaignId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 });
    }

    const normalizedStatus = String(application.status || '').toUpperCase();
    if (normalizedStatus !== 'SELECTED' && normalizedStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: '선정 상태(SELECTED/APPROVED)에서만 링크 재할당이 가능합니다.' },
        { status: 400 }
      );
    }

    const campaignOptions = (Array.isArray(campaign.campaign_options)
      ? campaign.campaign_options[0]
      : campaign.campaign_options) as CampaignOptionsPayload | null;
    const requiresAssignedPurchaseLink = Boolean(campaignOptions?.step1Data?.productUrlIndividual);
    const campaignProductName = normalizeOptionLabel(
      campaign.product_name || campaignOptions?.step1Data?.productName || ''
    );

    const { data: activeLinks, error: activeLinksError } = await admin
      .from('campaign_purchase_links')
      .select('id, option_key, option_label')
      .eq('campaign_id', campaignId)
      .eq('is_active', true);

    if (activeLinksError) {
      console.error('Application reassign link lookup error:', {
        campaignId,
        applicationId,
        actorUserId: user.id,
        activeLinksError,
      });
      return NextResponse.json({ error: '구매링크 상태를 확인할 수 없습니다.' }, { status: 500 });
    }

    const activeOptionLabels = Array.from(
      new Map(
        (activeLinks || [])
          .map((link) => normalizeOptionLabel(String(link.option_label || '')))
          .filter(Boolean)
          .map((label) => [normalizeOptionKey(label), label])
      ).values()
    );
    const singleActiveOptionLabel = activeOptionLabels.length === 1 ? activeOptionLabels[0] : '';
    const manualActiveLink = manualLinkId
      ? (activeLinks || []).find((link) => Number(link.id) === manualLinkId)
      : null;

    if (manualLinkId && !manualActiveLink) {
      return NextResponse.json({ error: '선택한 구매링크를 찾을 수 없습니다.' }, { status: 400 });
    }

    let optionCandidates = extractOptionCandidates(application.selected_option);
    if (
      requiresAssignedPurchaseLink &&
      campaignProductName &&
      optionCandidates.length === 1 &&
      isDefaultOptionLabel(optionCandidates[0].label)
    ) {
      optionCandidates = [{ label: campaignProductName, key: normalizeOptionKey(campaignProductName) }];
    }
    const requestedOptionLabel = normalizeOptionLabel(String(body.assignedOptionLabel || ''));
    let resolvedOptionLabel = requestedOptionLabel;

    if (!resolvedOptionLabel && optionCandidates.length > 0) {
      resolvedOptionLabel = optionCandidates[0].label;
    }
    if (
      optionCandidates.length === 0 &&
      (!resolvedOptionLabel || isDefaultOptionLabel(resolvedOptionLabel))
    ) {
      resolvedOptionLabel =
        normalizeOptionLabel(String(manualActiveLink?.option_label || '')) ||
        singleActiveOptionLabel ||
        campaignProductName ||
        '기본 옵션';
    }
    if (!resolvedOptionLabel) {
      resolvedOptionLabel = '기본 옵션';
    }

    if (optionCandidates.length > 0) {
      const candidateSet = new Set(optionCandidates.map((candidate) => normalizeOptionKey(candidate.label)));
      if (!candidateSet.has(normalizeOptionKey(resolvedOptionLabel))) {
        return NextResponse.json({ error: '신청자가 선택한 옵션 범위 밖의 값입니다.' }, { status: 400 });
      }
    }

    if (requiresAssignedPurchaseLink) {
      if (body.manualPurchaseLinkUrl && !manualPurchaseLinkUrl) {
        return NextResponse.json({ error: '구매링크는 http 또는 https로 시작해야 합니다.' }, { status: 400 });
      }

      if (!manualLinkId && manualPurchaseLinkUrl) {
        const { data: upsertedLink, error: upsertLinkError } = await admin
          .from('campaign_purchase_links')
          .upsert({
            campaign_id: campaignId,
            option_key: normalizeOptionKey(resolvedOptionLabel),
            option_label: resolvedOptionLabel,
            purchase_link_url: manualPurchaseLinkUrl,
            is_active: true,
            created_by: user.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'campaign_id,option_key,purchase_link_url',
          })
          .select('id')
          .single();

        if (upsertLinkError || !upsertedLink?.id) {
          console.error('Application reassign manual link upsert error:', {
            campaignId,
            applicationId,
            actorUserId: user.id,
            upsertLinkError,
          });
          return NextResponse.json({ error: '구매링크 저장에 실패했습니다.' }, { status: 500 });
        }

        manualLinkId = Number(upsertedLink.id);
      }

      const activeLinkCount = (activeLinks || []).length + (manualPurchaseLinkUrl ? 1 : 0);

      if (activeLinkCount === 0) {
        return NextResponse.json(
          { error: '구매평 개별전달 캠페인입니다. 구매링크를 먼저 등록한 뒤 재할당해 주세요.' },
          { status: 400 }
        );
      }
    }

    const { data: rpcRows, error: rpcError } = await admin.rpc('reassign_application_link', {
      p_application_id: applicationId,
      p_campaign_id: campaignId,
      p_actor_user_id: user.id,
      p_is_admin: isAdmin,
      p_assigned_option_label: resolvedOptionLabel,
      p_manual_link_id: manualLinkId,
    });

    if (rpcError) {
      console.error('reassign_application_link rpc error:', rpcError);
      return NextResponse.json(
        { error: rpcError.message || '링크 재할당에 실패했습니다.' },
        { status: 400 }
      );
    }

    const assignedRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    if (!assignedRow) {
      return NextResponse.json({ error: '재할당 결과를 확인할 수 없습니다.' }, { status: 500 });
    }

    if (requiresAssignedPurchaseLink && !assignedRow.assigned_purchase_link_url) {
      return NextResponse.json(
        { error: '구매링크가 배정되지 않아 재알림을 보낼 수 없습니다. 링크 풀과 옵션을 확인해 주세요.' },
        { status: 400 }
      );
    }

    const providedItems =
      campaign.experience_details ||
      campaign.product_name ||
      '캠페인 상세 페이지 참조';

    const notificationResult = await sendSelectionNotification({
      userId: application.user_id,
      campaignId,
      campaignTitle: campaign.title,
      providedItems,
      deadlineDate: formatDeadlineDate(campaign.end_date),
      assignedOptionLabel: assignedRow.assigned_option_label,
      assignedPurchaseLink: assignedRow.assigned_purchase_link_url,
    });

    return NextResponse.json({
      success: true,
      application: assignedRow,
      notification: notificationResult,
    });
  } catch (error) {
    console.error('Application reassign API error:', error);
    return NextResponse.json(
      { error: '링크 재할당 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
