import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { extractOptionCandidates, normalizeOptionKey, normalizeOptionLabel } from '@/lib/purchaseLink';
import { sendSelectionNotification } from '@/lib/applicationSelectionNotification';

interface SelectApplicationBody {
  applicationId?: number;
  campaignId?: number;
  targetStatus?: 'SELECTED' | 'APPROVED' | string;
  assignedOptionLabel?: string;
  manualLinkId?: number | null;
}

interface AssignedApplicationRow {
  id: number;
  status: string;
  assigned_option_key?: string | null;
  assigned_option_label?: string | null;
  assigned_purchase_link_id?: number | null;
  assigned_purchase_link_url?: string | null;
  link_assigned_at?: string | null;
  link_updated_at?: string | null;
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
    const manualLinkIdRaw = body.manualLinkId;
    const manualLinkId = manualLinkIdRaw == null ? null : Number(manualLinkIdRaw);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 applicationId 입니다.' }, { status: 400 });
    }

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 campaignId 입니다.' }, { status: 400 });
    }

    if (targetStatus !== 'SELECTED' && targetStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'targetStatus는 SELECTED 또는 APPROVED만 허용됩니다.' }, { status: 400 });
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
      .select('id, title, created_by, end_date, experience_details, product_name')
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

    const optionCandidates = extractOptionCandidates(application.selected_option);
    const requestedOptionLabel = normalizeOptionLabel(String(body.assignedOptionLabel || ''));
    let resolvedOptionLabel = requestedOptionLabel;

    if (!resolvedOptionLabel && optionCandidates.length > 0) {
      resolvedOptionLabel = optionCandidates[0].label;
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

    const assignedOptionKey = normalizeOptionKey(resolvedOptionLabel);

    const { count: activeLinkCount, error: linkCountError } = await admin
      .from('campaign_purchase_links')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('is_active', true);

    if (linkCountError) {
      console.error('Application select link count error:', {
        campaignId,
        applicationId,
        actorUserId: user.id,
        linkCountError,
      });
      return NextResponse.json({ error: '구매링크 상태를 확인할 수 없습니다.' }, { status: 500 });
    }

    let assignedRow: AssignedApplicationRow | null = null;

    if ((activeLinkCount || 0) > 0) {
      const { data: rpcRows, error: rpcError } = await admin.rpc('select_application_with_link', {
        p_application_id: applicationId,
        p_campaign_id: campaignId,
        p_actor_user_id: user.id,
        p_is_admin: isAdmin,
        p_target_status: targetStatus,
        p_assigned_option_label: resolvedOptionLabel,
        p_manual_link_id: manualLinkId,
      });

      if (rpcError) {
        console.error('select_application_with_link rpc error:', rpcError);
        return NextResponse.json(
          { error: rpcError.message || '선정 처리에 실패했습니다.' },
          { status: 400 }
        );
      }

      assignedRow = (Array.isArray(rpcRows) ? rpcRows[0] : rpcRows) as AssignedApplicationRow | null;
    } else {
      const { data: updatedApplication, error: updateError } = await admin
        .from('applications')
        .update({
          status: targetStatus,
          assigned_option_key: assignedOptionKey || null,
          assigned_option_label: resolvedOptionLabel || null,
        })
        .eq('id', applicationId)
        .eq('campaign_id', campaignId)
        .select('id, status, assigned_option_key, assigned_option_label, assigned_purchase_link_id, assigned_purchase_link_url, link_assigned_at, link_updated_at')
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

    const { error: incrementError } = await admin.rpc('increment_campaign_recruit_count', {
      campaign_id: campaignId,
    });

    if (incrementError) {
      console.error('increment_campaign_recruit_count rpc warning:', incrementError);
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
    console.error('Application select API error:', error);
    return NextResponse.json(
      { error: '선정 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
