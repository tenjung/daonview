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

    const body = (await request.json()) as ReassignLinkBody;
    const applicationId = Number(body.applicationId);
    const campaignId = Number(body.campaignId);
    const manualLinkIdRaw = body.manualLinkId;
    const manualLinkId = manualLinkIdRaw == null ? null : Number(manualLinkIdRaw);

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
      .select('id, title, created_by, end_date, experience_details, product_name')
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
