import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeOptionKey } from '@/lib/purchaseLink';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PurchaseLinkRow {
  option_key: string;
  option_label: string;
  purchase_link_url: string;
}

function injectPurchaseLinkPools(campaignOptions: unknown, rows: PurchaseLinkRow[]) {
  const poolsByKey = new Map<string, { optionLabel: string; links: string[] }>();
  rows.forEach((row) => {
    const optionKey = normalizeOptionKey(row.option_key || row.option_label || '');
    const url = String(row.purchase_link_url || '').trim();
    if (!optionKey || !/^https?:\/\//i.test(url)) return;

    const existing = poolsByKey.get(optionKey);
    if (existing) {
      if (!existing.links.includes(url)) existing.links.push(url);
      return;
    }
    poolsByKey.set(optionKey, {
      optionLabel: String(row.option_label || '').trim(),
      links: [url],
    });
  });

  const injectEntry = (entry: unknown) => {
    const root = entry && typeof entry === 'object'
      ? entry as Record<string, unknown>
      : {};
    const step1Data = root.step1Data && typeof root.step1Data === 'object'
      ? root.step1Data as Record<string, unknown>
      : {};

    return {
      ...root,
      step1Data: {
        ...step1Data,
        purchaseLinkPools: Array.from(poolsByKey.values()),
      },
    };
  };

  return Array.isArray(campaignOptions)
    ? campaignOptions.map(injectEntry)
    : injectEntry(campaignOptions);
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '사용자 권한을 확인할 수 없습니다.' }, { status: 403 });
    }

    const role = String(profile.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'MASTER' || role === 'SUPER_ADMIN';
    const isAdvertiser = role === 'ADVERTISER';

    if (!isAdmin && !isAdvertiser) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: campaign, error: campaignError } = await admin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인 데이터를 불러오지 못했습니다.' }, { status: 404 });
    }

    if (!isAdmin && campaign.created_by !== user.id) {
      return NextResponse.json({ error: '내 캠페인만 수정할 수 있습니다.' }, { status: 403 });
    }

    const { data: purchaseLinks, error: purchaseLinksError } = await admin
      .from('campaign_purchase_links')
      .select('option_key, option_label, purchase_link_url')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (purchaseLinksError) {
      console.error('Editable campaign purchase links lookup failed:', purchaseLinksError);
      return NextResponse.json({ error: '옵션별 구매링크를 불러오지 못했습니다.' }, { status: 500 });
    }

    const editableCampaign = {
      ...campaign,
      campaign_options: injectPurchaseLinkPools(
        campaign.campaign_options,
        (purchaseLinks || []) as PurchaseLinkRow[]
      ),
    };

    return NextResponse.json({ data: editableCampaign }, { status: 200 });
  } catch (error) {
    console.error('Editable campaign API error:', error);
    return NextResponse.json({ error: '캠페인 조회 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
