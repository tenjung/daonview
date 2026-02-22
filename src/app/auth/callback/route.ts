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
