import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole, isAdvertiserRole } from '@/lib/campaignPermissions';
import { recommendSmartStoreCategories } from '@/lib/ai/smartStoreTags';

async function hasActiveAdvertiserSubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status, expires_at')
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'CANCELLED'])
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error('구독 상태 확인 중 오류가 발생했습니다.');
  }

  return Boolean(data);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: '사용자 권한 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }

    const isAdmin = isAdminRole(profile?.role);
    const isAdvertiser = isAdvertiserRole(profile?.role);

    if (!isAdmin && !isAdvertiser) {
      return NextResponse.json({ error: '관리자 또는 광고주만 이용할 수 있는 서비스입니다.' }, { status: 403 });
    }

    if (!isAdmin) {
      const hasSubscription = await hasActiveAdvertiserSubscription(supabase, user.id);

      if (!hasSubscription) {
        return NextResponse.json(
          { error: '월 자동결제 이용권이 활성화된 광고주만 이용할 수 있습니다.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json() as { seedKeyword?: unknown };
    const seedKeyword = typeof body.seedKeyword === 'string' ? body.seedKeyword.trim() : '';

    if (!seedKeyword || seedKeyword.length < 2) {
      return NextResponse.json({ error: '기준 검색어를 2자 이상 입력해주세요.' }, { status: 400 });
    }

    const result = await recommendSmartStoreCategories(seedKeyword);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[smart-store-tags] category API error:', error);
    const message = error instanceof Error ? error.message : '카테고리 추천 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
