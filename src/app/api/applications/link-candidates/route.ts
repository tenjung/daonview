import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { normalizeOptionKey, normalizeOptionLabel } from '@/lib/purchaseLink';

interface LinkCandidatesBody {
  campaignId?: number;
  optionLabel?: string;
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

    const body = (await request.json()) as LinkCandidatesBody;
    const campaignId = Number(body.campaignId);
    const optionLabel = normalizeOptionLabel(String(body.optionLabel || ''));
    const optionKey = normalizeOptionKey(optionLabel);

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 campaignId 입니다.' }, { status: 400 });
    }

    if (!optionKey) {
      return NextResponse.json({ error: 'optionLabel은 필수입니다.' }, { status: 400 });
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
      .select('id, created_by')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!isAdmin && campaign.created_by !== user.id) {
      return NextResponse.json({ error: '링크 조회 권한이 없습니다.' }, { status: 403 });
    }

    const { data: exactLinks, error: linksError } = await admin
      .from('campaign_purchase_links')
      .select('id, option_label, purchase_link_url, is_active')
      .eq('campaign_id', campaignId)
      .eq('option_key', optionKey)
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (linksError) {
      console.error('Link candidates fetch error:', linksError);
      return NextResponse.json({ error: '링크 목록 조회에 실패했습니다.' }, { status: 500 });
    }

    let links = exactLinks || [];

    if ((!links || links.length === 0) && normalizeOptionKey(optionLabel) === normalizeOptionKey('기본 옵션')) {
      const { data: fallbackLinks, error: fallbackError } = await admin
        .from('campaign_purchase_links')
        .select('id, option_key, option_label, purchase_link_url, is_active')
        .eq('campaign_id', campaignId)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (fallbackError) {
        console.error('Link candidates fallback fetch error:', fallbackError);
        return NextResponse.json({ error: '링크 목록 조회에 실패했습니다.' }, { status: 500 });
      }

      const optionKeys = new Set((fallbackLinks || []).map((link) => normalizeOptionKey(link.option_label || '')));
      if (optionKeys.size === 1) {
        links = fallbackLinks || [];
      }
    }

    const linkIds = (links || []).map((link) => Number(link.id)).filter(Boolean);

    const usageMap = new Map<number, number>();
    if (linkIds.length > 0) {
      const { data: assignments, error: assignmentError } = await admin
        .from('applications')
        .select('assigned_purchase_link_id, status')
        .eq('campaign_id', campaignId)
        .in('status', ['SELECTED', 'APPROVED'])
        .in('assigned_purchase_link_id', linkIds);

      if (assignmentError) {
        console.error('Link usage fetch warning:', assignmentError);
      } else {
        (assignments || []).forEach((assignment) => {
          const id = Number(assignment.assigned_purchase_link_id);
          usageMap.set(id, (usageMap.get(id) || 0) + 1);
        });
      }
    }

    const candidates = (links || []).map((link) => ({
      id: link.id,
      optionLabel: link.option_label,
      purchaseLinkUrl: link.purchase_link_url,
      usageCount: usageMap.get(Number(link.id)) || 0,
    }));

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    console.error('Link candidates API error:', error);
    return NextResponse.json({ error: '링크 후보 조회 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
