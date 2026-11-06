import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { extractOptionCandidates, normalizeOptionKey, normalizeOptionLabel, normalizePurchaseLinkUrl, type SelectionLinkAssignment } from '@/lib/purchaseLink';
import { getSelectionCampaignOptions, notifySelectedApplication } from '@/lib/applicationSelectionNotification';

interface SelectApplicationBody {
  applicationId?: number;
  campaignId?: number;
  targetStatus?: 'SELECTED' | 'APPROVED' | string;
  assignedOptionLabel?: string;
  optionAssignments?: SelectionLinkAssignment[];
  manualLinkId?: number | null;
  manualPurchaseLinkUrl?: string | null;
}

interface AssignedApplicationRow {
  id: number;
  status: string;
  assigned_option_key?: string | null;
  assigned_option_label?: string | null;
  assigned_purchase_link_id?: number | null;
  assigned_purchase_link_url?: string | null;
  assigned_purchase_links?: AssignedPurchaseLink[] | null;
  link_assigned_at?: string | null;
  link_updated_at?: string | null;
}

interface AssignedPurchaseLink {
  optionKey: string;
  optionLabel: string;
  linkId: number;
  url: string;
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

    const body = (await request.json()) as SelectApplicationBody;
    const applicationId = Number(body.applicationId);
    const campaignId = Number(body.campaignId);
    const targetStatus = String(body.targetStatus || 'SELECTED').toUpperCase();
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 applicationId 입니다.' }, { status: 400 });
    }

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 campaignId 입니다.' }, { status: 400 });
    }

    if (targetStatus !== 'SELECTED' && targetStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'targetStatus는 SELECTED 또는 APPROVED만 허용됩니다.' }, { status: 400 });
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

    if (campaignError) {
      console.error('Application select campaign lookup error:', {
        campaignId,
        applicationId,
        actorUserId: user.id,
        campaignError,
      });
      return NextResponse.json({ error: '캠페인 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!campaign) {
      console.error('Application select campaign not found:', {
        campaignId,
        applicationId,
        actorUserId: user.id,
      });
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!isAdmin && campaign.created_by !== user.id) {
      return NextResponse.json({ error: '선정 권한이 없습니다.' }, { status: 403 });
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

    if (String(application.status || '').toUpperCase() !== 'PENDING') {
      return NextResponse.json({ error: '대기 상태(PENDING) 신청서만 선정할 수 있습니다.' }, { status: 400 });
    }

    const campaignOptions = getSelectionCampaignOptions(campaign.campaign_options);
    const requiresAssignedPurchaseLink = Boolean(campaignOptions?.step1Data?.productUrlIndividual);
    const campaignProductName = normalizeOptionLabel(
      campaign.product_name || campaignOptions?.step1Data?.productName || ''
    );

    const { data: activeLinks, error: activeLinksError } = await admin
      .from('campaign_purchase_links')
      .select('id, option_key, option_label, purchase_link_url')
      .eq('campaign_id', campaignId)
      .eq('is_active', true);

    if (activeLinksError) {
      console.error('Application select link lookup error:', {
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
    let optionCandidates = extractOptionCandidates(application.selected_option);
    if (
      requiresAssignedPurchaseLink &&
      campaignProductName &&
      optionCandidates.length === 1 &&
      isDefaultOptionLabel(optionCandidates[0].label)
    ) {
      optionCandidates = [{ label: campaignProductName, key: normalizeOptionKey(campaignProductName) }];
    }
    const requestedOptionLabel = normalizeOptionLabel(body.assignedOptionLabel || '');
    const fallbackOption = singleActiveOptionLabel || campaignProductName || '기본 옵션';
    const resolvedOptionLabel = optionCandidates.length
      ? requestedOptionLabel || optionCandidates[0].label
      : requestedOptionLabel && !isDefaultOptionLabel(requestedOptionLabel) ? requestedOptionLabel : fallbackOption;
    const allowedOptionKeys = new Set(optionCandidates.length
      ? optionCandidates.map(({ key }) => key)
      : [fallbackOption, campaignProductName].filter(Boolean).map(normalizeOptionKey));

    let assignedRow: AssignedApplicationRow | null = null;

    if (requiresAssignedPurchaseLink) {
      // Keep accepting a single explicit assignment from older clients.
      const requestedAssignments = body.optionAssignments ?? (body.manualLinkId != null || body.manualPurchaseLinkUrl != null
        ? [{ optionLabel: resolvedOptionLabel, manualLinkId: body.manualLinkId, manualPurchaseLinkUrl: body.manualPurchaseLinkUrl }]
        : []);
      if (!Array.isArray(requestedAssignments) || requestedAssignments.length < 1 || requestedAssignments.length > 2) {
        return NextResponse.json({ error: '확정 옵션마다 구매링크를 지정해 주세요.' }, { status: 400 });
      }

      const assignmentPayload: SelectionLinkAssignment[] = [];
      const seenOptions = new Set<string>();
      for (const assignment of requestedAssignments) {
        const optionLabel = normalizeOptionLabel(assignment?.optionLabel || '');
        const optionKey = normalizeOptionKey(optionLabel);
        // For older applications without an option, the sole link pool can
        // supply the real label in place of the UI's generic default.
        const effectiveLabel = !optionCandidates.length && isDefaultOptionLabel(optionLabel) ? fallbackOption : optionLabel;
        const effectiveKey = normalizeOptionKey(effectiveLabel);
        if (!optionKey || !allowedOptionKeys.has(effectiveKey) || seenOptions.has(effectiveKey)) {
          return NextResponse.json({ error: (optionLabel || '확정 옵션') + ': 신청서에서 확정할 수 없는 옵션입니다.' }, { status: 400 });
        }
        seenOptions.add(effectiveKey);

        const id = assignment.manualLinkId;
        const rawUrl = assignment.manualPurchaseLinkUrl;
        if ((id != null) === (rawUrl != null)) {
          return NextResponse.json({ error: effectiveLabel + ': 등록 링크 선택 또는 직접 입력 중 하나를 지정해 주세요.' }, { status: 400 });
        }
        if (id != null) {
          const candidate = activeLinks?.find((link) => link.id === id && normalizeOptionKey(link.option_key) === effectiveKey);
          if (!Number.isSafeInteger(id) || id <= 0 || !normalizePurchaseLinkUrl(candidate?.purchase_link_url)) {
            return NextResponse.json({ error: effectiveLabel + ': 해당 옵션에서 사용할 수 없는 링크입니다.' }, { status: 400 });
          }
          assignmentPayload.push({ optionLabel: effectiveLabel, manualLinkId: id });
        } else {
          const url = normalizePurchaseLinkUrl(rawUrl);
          if (!url) {
            return NextResponse.json({ error: effectiveLabel + ': 올바른 http 또는 https 주소를 입력해 주세요.' }, { status: 400 });
          }
          assignmentPayload.push({ optionLabel: effectiveLabel, manualPurchaseLinkUrl: url });
        }
      }
      const { data: rpcRows, error: rpcError } = await admin.rpc('select_application_with_explicit_links', {
        p_application_id: applicationId,
        p_campaign_id: campaignId,
        p_actor_user_id: user.id,
        p_is_admin: isAdmin,
        p_target_status: targetStatus,
        p_assignments: assignmentPayload,
      });

      if (rpcError) {
        console.error('select_application_with_explicit_links rpc error:', rpcError);
        return NextResponse.json(
          { error: rpcError.message || '선정 처리에 실패했습니다.' },
          { status: 400 }
        );
      }

      assignedRow = (Array.isArray(rpcRows) ? rpcRows[0] : rpcRows) as AssignedApplicationRow | null;
    } else {
      if (optionCandidates.length && !allowedOptionKeys.has(normalizeOptionKey(resolvedOptionLabel))) {
        return NextResponse.json({ error: '신청자가 선택한 옵션 범위 밖의 값입니다.' }, { status: 400 });
      }
      const { data: updatedApplication, error: updateError } = await admin
        .from('applications')
        .update({
          status: targetStatus,
          assigned_option_key: normalizeOptionKey(resolvedOptionLabel) || null,
          assigned_option_label: resolvedOptionLabel || null,
          assigned_purchase_links: [],
        })
        .eq('id', applicationId)
        .eq('campaign_id', campaignId)
        .ilike('status', 'PENDING')
        .select('id, status, assigned_option_key, assigned_option_label, assigned_purchase_link_id, assigned_purchase_link_url, assigned_purchase_links, link_assigned_at, link_updated_at')
        .single();

      if (updateError || !updatedApplication) {
        console.error('Application select direct update error:', {
          campaignId,
          applicationId,
          actorUserId: user.id,
          updateError,
        });
        return NextResponse.json(
          { error: '신청 승인 처리에 실패했습니다.' },
          { status: 500 }
        );
      }

      assignedRow = updatedApplication as AssignedApplicationRow;
    }

    if (!assignedRow) {
      return NextResponse.json({ error: '선정 결과를 확인할 수 없습니다.' }, { status: 500 });
    }

    revalidateTag('home-banner-data', 'max');
    revalidatePath('/');
    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);

    const notificationResult = await notifySelectedApplication(campaign, application.user_id, assignedRow);

    return NextResponse.json({
      success: true,
      application: assignedRow,
      notification: notificationResult,
    });
  } catch (error) {
    console.error('Application select API error:', error);
    return NextResponse.json(
      { error: '선정 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
