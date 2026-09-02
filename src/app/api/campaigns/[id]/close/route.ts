import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function formatKstDate(date: Date = new Date()) {
  const shifted = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(_request: Request, { params }: RouteParams) {
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
      return NextResponse.json({ error: '캠페인을 마감할 권한이 없습니다.' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: campaign, error: campaignError } = await admin
      .from('campaigns')
      .select('id, title, status, end_date, created_by')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!isAdmin && campaign.created_by !== user.id) {
      return NextResponse.json({ error: '본인 캠페인만 마감할 수 있습니다.' }, { status: 403 });
    }

    const normalizedStatus = String(campaign.status || '').toUpperCase();
    if (!['RECRUITING', 'ONGOING'].includes(normalizedStatus)) {
      return NextResponse.json({ error: '모집중 또는 진행중 캠페인만 마감할 수 있습니다.' }, { status: 400 });
    }

    const today = formatKstDate();
    const nextEndDate = campaign.end_date && String(campaign.end_date) < today
      ? campaign.end_date
      : today;

    const { data: updated, error: updateError } = await admin
      .from('campaigns')
      .update({
        status: 'COMPLETED',
        end_date: nextEndDate,
      })
      .eq('id', campaignId)
      .select('id, title, status, end_date')
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: '캠페인 마감 처리에 실패했습니다.' }, { status: 500 });
    }

    revalidateTag('home-banner-data', 'max');
    revalidatePath('/');
    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);

    return NextResponse.json({
      success: true,
      campaign: updated,
    });
  } catch (error) {
    console.error('Campaign close API error:', error);
    return NextResponse.json({ error: '캠페인 마감 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
