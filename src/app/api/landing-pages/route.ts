import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LandingPageInput, AIGeneratedContent } from '@/types/landingPage';

// GET: 사용자의 모든 랜딩페이지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('랜딩페이지 조회 오류:', error);
      return NextResponse.json({ error: '랜딩페이지를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ landingPages: data });
  } catch (error) {
    console.error('GET 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST: 새로운 랜딩페이지 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, inputData, generatedContent, published } = body;

    if (!title || !inputData || !generatedContent) {
      return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
    }

    // slug 생성 (제목 기반 + 랜덤 문자열)
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const { data, error } = await supabase
      .from('landing_pages')
      .insert({
        user_id: user.id,
        slug,
        title,
        target_type: inputData.targetType,
        input_data: inputData,
        ai_generated_content: generatedContent,
        published: published || false,
      })
      .select()
      .single();

    if (error) {
      console.error('랜딩페이지 저장 오류:', error);
      return NextResponse.json({ error: '랜딩페이지를 저장하는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ landingPage: data });
  } catch (error) {
    console.error('POST 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
