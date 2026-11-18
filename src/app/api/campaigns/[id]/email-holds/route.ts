import { NextResponse } from 'next/server';
import { EmailHoldAccessError, getCampaignEmailHolds } from '@/lib/selectionEmailHoldServer';

export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: '잘못된 캠페인입니다.' }, { status: 400 });
  try {
    return NextResponse.json(await getCampaignEmailHolds(id), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const status = error instanceof EmailHoldAccessError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? '보류 내역을 불러오지 못했습니다.' : '접근 권한을 확인해 주세요.' }, { status });
  }
}
