import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole, isAdvertiserRole } from '@/lib/campaignPermissions';
import { analyzeSmartStoreTags } from '@/lib/ai/smartStoreTags';

const DAILY_LIMIT = 2;

function getKstTodayRange() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const kstToday = kstDate.toISOString().split('T')[0];

  return {
    start: `${kstToday}T00:00:00+09:00`,
    end: `${kstToday}T23:59:59+09:00`,
  };
}

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

      const range = getKstTodayRange();
      const { count, error: countError } = await supabase
        .from('ai_smart_store_tag_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', range.start)
        .lt('created_at', range.end);

      if (countError) {
        return NextResponse.json({ error: '사용 횟수 확인 중 오류가 발생했습니다.' }, { status: 500 });
      }

      if (count !== null && count >= DAILY_LIMIT) {
        return NextResponse.json(
          { error: '일일 스마트스토어 태그 분석 제한 횟수(2회)를 모두 소모했습니다. 내일 다시 이용해주세요.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json() as {
      seedKeyword?: unknown;
      categoryPath?: unknown;
      rawTags?: unknown;
    };
    const seedKeyword = typeof body.seedKeyword === 'string' ? body.seedKeyword.trim() : '';
    const categoryPath = typeof body.categoryPath === 'string' ? body.categoryPath.trim() : '';
    const rawTags = typeof body.rawTags === 'string' ? body.rawTags : '';

    if (!seedKeyword || seedKeyword.length < 2) {
      return NextResponse.json({ error: '기준 검색어를 2자 이상 입력해주세요.' }, { status: 400 });
    }

    if (!categoryPath || categoryPath.length < 2) {
      return NextResponse.json({ error: '카테고리 경로를 입력해주세요.' }, { status: 400 });
    }

    const result = await analyzeSmartStoreTags({ seedKeyword, categoryPath, rawTags });

    if (result.totalTags === 0) {
      return NextResponse.json({ error: '상위 쇼핑 상품에서 유효한 태그 후보를 찾지 못했습니다.' }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from('ai_smart_store_tag_logs')
      .insert({
        user_id: user.id,
        seed_keyword: result.seedKeyword,
        category_path: result.categoryPath,
        tag_count: result.totalTags,
      });

    if (insertError) {
      console.warn('[smart-store-tags] log insert failed:', insertError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[smart-store-tags] API error:', error);
    const message = error instanceof Error ? error.message : '스마트스토어 태그 분석 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
