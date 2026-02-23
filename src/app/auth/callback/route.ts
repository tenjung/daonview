import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const searchParams = requestUrl.searchParams;

  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Exchange error:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    // OAuth 완료 후 사용자 정보로 프로필 보완 (avatar_url 등)
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata ?? {};

        // 카카오: picture 또는 avatar_url / 구글: picture
        const avatarUrl: string | null =
          meta.avatar_url ?? meta.picture ?? null;

        // nickname 우선순위: nickname > full_name > name > email 앞부분
        const nickname: string =
          meta.nickname ??
          meta.full_name ??
          meta.name ??
          (user.email ? user.email.split('@')[0] : '');

        // 기존 프로필 확인
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (!existing) {
          // 프로필이 없으면 새로 생성 (트리거 미실행 케이스 대비)
          const pending_role = (meta.role ?? 'INFLUENCER').toUpperCase();
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              nickname,
              role: pending_role,
              avatar_url: avatarUrl,
            });
          if (insertError) {
            console.error('Profile insert error:', insertError.message);
          }
        } else {
          // 프로필이 있으면 avatar_url만 갱신 (role 등 기존 데이터 보호)
          // 단, 카카오에서 avatar_url이 null이면 기존 값 유지
          if (avatarUrl !== null) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: avatarUrl })
              .eq('id', user.id);
            if (updateError) {
              console.error('Profile avatar update error:', updateError.message);
            }
          }
        }
      }
    } catch (e) {
      console.error('Auth callback profile sync error:', e);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
