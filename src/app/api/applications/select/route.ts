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
      .select('id, title, created_by, end_date, provision, experience_details, product_name')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
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

    const assignedRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
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
      campaign.provision ||
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
