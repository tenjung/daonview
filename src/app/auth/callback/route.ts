import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const searchParams = requestUrl.searchParams;

  const code = searchParams.get('code');
  const providerError = searchParams.get('error');
  const providerErrorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') ? next : '/';
  const successRedirect = NextResponse.redirect(`${origin}${safeNext}`);
  const errorRedirect = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Keep Next.js cookie store and redirect response in sync.
              cookieStore.set(name, value, options);
              successRedirect.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Exchange error:', error);
      return errorRedirect(error.message);
    }

    // OAuth 완료 후 사용자 정보로 프로필 보완 (avatar_url 등)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata ?? {};

        // 카카오: picture 또는 avatar_url / 구글: picture
        const avatarUrl: string | null = meta.avatar_url ?? meta.picture ?? null;

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
          const pendingRole = (meta.role ?? 'INFLUENCER').toUpperCase();
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            nickname,
            role: pendingRole,
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

    return successRedirect;
  }

  if (providerError) {
    const message = providerErrorDescription
      ? `${providerError}: ${providerErrorDescription}`
      : providerError;
    return errorRedirect(message);
  }

  // return the user to an error page with instructions
  return errorRedirect('auth_callback_failed');
}
