import { NextResponse } from 'next/server';
import { getPublicCampaignList } from '@/lib/publicCampaignServer';
export async function GET() {
  try {
    return NextResponse.json({ campaigns: await getPublicCampaignList() });
  } catch {
    return NextResponse.json({ error: '공개 캠페인 목록을 불러오지 못했습니다.' }, { status: 503 });
  }
}
