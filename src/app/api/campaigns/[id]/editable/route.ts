import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
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

    return NextResponse.json({ data: campaign }, { status: 200 });
  } catch (error) {
    console.error('Editable campaign API error:', error);
    return NextResponse.json({ error: '캠페인 조회 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

