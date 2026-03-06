import { NextRequest, NextResponse } from 'next/server';
import { searchPexelsAssets } from '@/lib/video/pexels';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    if (!query.trim()) {
      return NextResponse.json({ items: [] });
    }

    const items = await searchPexelsAssets(query);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[Pexels Search GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pexels 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
