import { NextResponse } from 'next/server';

import { getManagedReviewsForActor } from '@/lib/reviews/management';
import { getRequestAuth } from '@/lib/auth/requestAuth';

export async function GET() {
  try {
    const auth = await getRequestAuth();
    const { user, profile } = auth;
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    if (auth.profileError || !profile || !auth.role) return NextResponse.json({ error: '사용자 프로필을 확인하지 못했습니다.' }, { status: 503 });
    const reviews = await getManagedReviewsForActor(user.id, { ...auth, user, profile });
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Managed reviews lookup error:', error);
    return NextResponse.json({ error: '리뷰 검수 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}

