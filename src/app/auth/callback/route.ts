import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const host = request.headers.get('host');
  const searchParams = requestUrl.searchParams;

  console.log('--- [AUTH CALLBACK DEBUG] ---');
  console.log('Current Host:', host);
  console.log('Current Origin:', origin);
  console.log('Request URL:', request.url);
  
  const code = searchParams.get('code');
  const role = searchParams.get('role'); // Capture role if coming from signup page
  
  // if "next" is in search params, use it as the redirection URL
  // If role is present, we might want to redirect based on it, but usually syncProfile handles it.
  // We can pass role back to the frontend via etc.
  // Simplify next path to root. Frontend will handle role-based redirection if needed via authStore
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    console.log('Exchanging code for session...', { code, origin });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Exchange error:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    if (data.session) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
