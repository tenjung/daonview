import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 이 호출이 서버(Next.js)의 쿠키 스토어에서 Supabase 관련 쿠키를 모두 제거(만료)시킵니다.
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Server side Supabase logout error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server side logout exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
