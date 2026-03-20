import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { normalizeOptionKey, normalizeOptionLabel } from '@/lib/purchaseLink';

interface PurchaseLinkPoolInput {
  optionLabel?: string;
  links?: string[];
}

interface SyncPurchaseLinksBody {
  campaignId?: number;
  purchaseLinkPools?: PurchaseLinkPoolInput[];
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

    const body = (await request.json()) as SyncPurchaseLinksBody;
    const campaignId = Number(body.campaignId);

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 campaignId 입니다.' }, { status: 400 });
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
      return NextResponse.json({ error: '링크 풀을 수정할 권한이 없습니다.' }, { status: 403 });
    }

    const pools = Array.isArray(body.purchaseLinkPools) ? body.purchaseLinkPools : [];
    const nowIso = new Date().toISOString();
    const normalizedRows = new Map<
      string,
      {
        campaign_id: number;
        option_key: string;
        option_label: string;
        purchase_link_url: string;
        is_active: boolean;
        created_by: string;
        updated_at: string;
      }
    >();

    pools.forEach((pool) => {
      const optionLabel = normalizeOptionLabel(String(pool.optionLabel || ''));
      const optionKey = normalizeOptionKey(optionLabel);
      const links = Array.isArray(pool.links) ? pool.links : [];
      if (!optionKey) return;

      links
        .map((link) => String(link || '').trim())
        .filter((link) => /^https?:\/\//i.test(link))
        .forEach((link) => {
          const dedupeKey = `${optionKey}::${link}`;
          normalizedRows.set(dedupeKey, {
            campaign_id: campaignId,
            option_key: optionKey,
            option_label: optionLabel,
            purchase_link_url: link,
            is_active: true,
            created_by: user.id,
            updated_at: nowIso,
          });
        });
    });

    const upsertPayload = Array.from(normalizedRows.values());

    if (upsertPayload.length === 0) {
      const { error: deactivateError } = await admin
        .from('campaign_purchase_links')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId);

      if (deactivateError) {
        console.error('Deactivate links error:', deactivateError);
        return NextResponse.json({ error: '기존 링크 비활성화에 실패했습니다.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        totalActive: 0,
      });
    }

    const { data: upsertedRows, error: upsertError } = await admin
      .from('campaign_purchase_links')
      .upsert(upsertPayload, {
        onConflict: 'campaign_id,option_key,purchase_link_url',
      })
      .select('id');

    if (upsertError) {
      console.error('Upsert purchase links error:', upsertError);
      return NextResponse.json({ error: '링크 풀 저장에 실패했습니다.' }, { status: 500 });
    }

    const activeIds = (upsertedRows || [])
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id));

    if (activeIds.length > 0) {
      const { error: staleDeactivateError } = await admin
        .from('campaign_purchase_links')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .not('id', 'in', `(${activeIds.join(',')})`);

      if (staleDeactivateError) {
        console.error('Deactivate stale links warning:', staleDeactivateError);
      }
    }

    return NextResponse.json({
      success: true,
      totalActive: activeIds.length,
    });
  } catch (error) {
    console.error('Campaign purchase link sync API error:', error);
    return NextResponse.json({ error: '링크 풀 동기화 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
