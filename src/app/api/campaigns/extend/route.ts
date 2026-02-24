import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface ExtendBody {
  campaignId?: number;
  days?: number;
}

const ALLOWED_DAYS = new Set([3, 7, 14]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as ExtendBody;
    const campaignId = Number(body.campaignId);
    const days = Number(body.days);

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 campaignId 입니다.' }, { status: 400 });
    }

    if (!ALLOWED_DAYS.has(days)) {
      return NextResponse.json({ error: 'days는 3, 7, 14 중 하나여야 합니다.' }, { status: 400 });
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
    const adminClient = createAdminClient();

    const { data: campaign, error: campaignError } = await adminClient
      .from('campaigns')
      .select('id, end_date, created_by')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAdmin = role === 'ADMIN';
    const isOwner = campaign.created_by === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: '해당 캠페인을 연장할 권한이 없습니다.' }, { status: 403 });
    }

    const currentEndDate = new Date(campaign.end_date);
    if (Number.isNaN(currentEndDate.getTime())) {
      return NextResponse.json({ error: '현재 마감일 데이터가 올바르지 않습니다.' }, { status: 400 });
    }

    const nextEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);

    const { data: updated, error: updateError } = await adminClient
      .from('campaigns')
      .update({ end_date: nextEndDate.toISOString() })
      .eq('id', campaignId)
      .select('id, end_date')
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: '마감일 연장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaignId: updated.id,
      endDate: updated.end_date,
      days,
    });
  } catch (error) {
    console.error('Campaign extend API error:', error);
    return NextResponse.json({ error: '기간 연장 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
