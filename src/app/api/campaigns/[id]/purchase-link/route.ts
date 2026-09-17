import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getStep1Data(campaignOptions: unknown): Record<string, unknown> {
  const root = Array.isArray(campaignOptions) ? campaignOptions[0] : campaignOptions;
  if (!root || typeof root !== 'object') return {};
  const step1Data = (root as { step1Data?: unknown }).step1Data;
  return step1Data && typeof step1Data === 'object'
    ? step1Data as Record<string, unknown>
    : {};
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const campaignId = Number(id);

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 캠페인 ID입니다.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const [{ data: campaign, error: campaignError }, { data: application, error: applicationError }] = await Promise.all([
      admin
        .from('campaigns')
        .select('id, campaign_options')
        .eq('id', campaignId)
        .single(),
      admin
        .from('applications')
        .select('status, assigned_option_label, assigned_purchase_link_url, assigned_purchase_links')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (applicationError) {
      console.error('Selected purchase link application lookup failed:', applicationError);
      return NextResponse.json({ error: '신청 정보를 확인할 수 없습니다.' }, { status: 500 });
    }

    const status = String(application?.status || '').toUpperCase();
    if (status !== 'SELECTED' && status !== 'APPROVED') {
      return NextResponse.json({ error: '선정된 신청자만 링크를 확인할 수 있습니다.' }, { status: 403 });
    }

    const step1Data = getStep1Data(campaign.campaign_options);
    const productUrlIndividual = Boolean(step1Data.productUrlIndividual);
    const assignedLinks = productUrlIndividual && Array.isArray(application?.assigned_purchase_links)
      ? application.assigned_purchase_links
        .filter((item): item is { optionLabel: string; url: string } => (
          Boolean(item) &&
          typeof item === 'object' &&
          typeof item.optionLabel === 'string' &&
          typeof item.url === 'string' &&
          /^https?:\/\//i.test(item.url)
        ))
        .slice(0, 2)
      : [];
    const fallbackUrl = productUrlIndividual
      ? String(application?.assigned_purchase_link_url || '').trim()
      : String(step1Data.productUrl || '').trim();
    const links = assignedLinks.length > 0
      ? assignedLinks
      : /^https?:\/\//i.test(fallbackUrl)
        ? [{ optionLabel: application?.assigned_option_label || '확정 옵션', url: fallbackUrl }]
        : [];
    const resolvedUrl = links[0]?.url || '';

    if (!/^https?:\/\//i.test(resolvedUrl)) {
      return NextResponse.json({ error: '확인 가능한 구매 링크가 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      url: resolvedUrl,
      optionLabel: links[0]?.optionLabel || null,
      links,
    });
  } catch (error) {
    console.error('Selected purchase link API error:', error);
    return NextResponse.json({ error: '구매 링크 조회 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
