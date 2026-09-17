import { NextResponse } from 'next/server';

import { getManagedReviewsForActor } from '@/lib/reviews/management';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const reviews = await getManagedReviewsForActor(user.id);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Managed reviews lookup error:', error);
    return NextResponse.json({ error: '리뷰 검수 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}

