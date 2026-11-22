import { NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const REQUEST_WINDOW_MS = 10 * 60 * 1000;

/**
 * 광고주의 사업자 인증 수동 심사 요청을 관리자에게 알린다.
 * notifications INSERT는 관리자 정책만 허용하므로 서버 권한으로 생성하고,
 * 방금 PENDING으로 제출한 본인 요청에 대해서만 알림을 만든다.
 */
export async function POST() {
  try {
    const { user, profile, role, profileError } = await getRequestAuth();
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    if (profileError || !profile) return NextResponse.json({ error: profileError || '프로필을 찾을 수 없습니다.' }, { status: 503 });
    if (role !== 'ADVERTISER') return NextResponse.json({ error: '광고주 계정만 요청할 수 있습니다.' }, { status: 403 });

    const status = String(profile.biz_verification_status || '').toUpperCase();
    const requestedAt = profile.biz_verification_requested_at ? Date.parse(profile.biz_verification_requested_at) : NaN;
    if (status !== 'PENDING' || !Number.isFinite(requestedAt) || Date.now() - requestedAt > REQUEST_WINDOW_MS) {
      return NextResponse.json({ error: '심사 대기 중인 최근 요청이 없습니다.' }, { status: 409 });
    }

    const admin = createAdminClient();
    const { data: admins, error: adminError } = await admin.from('profiles').select('id').eq('role', 'ADMIN');
    if (adminError) throw adminError;
    if (!admins?.length) return NextResponse.json({ success: true, notified: 0 });

    const companyName = profile.company_name || '광고주';
    const { error: insertError } = await admin.from('notifications').insert(admins.map(({ id }) => ({
      user_id: id,
      type: 'SYSTEM',
      title: '🏢 새 사업자 인증 요청',
      content: `[${companyName}] 광고주가 사업자 인증을 요청했습니다. (AI 자동승인 실패)`,
      link: '/dashboard/admin/verifications',
    })));
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, notified: admins.length });
  } catch (error) {
    console.error('[verification-request] notify failed', error);
    return NextResponse.json({ error: '관리자 알림 생성에 실패했습니다.' }, { status: 500 });
  }
}
