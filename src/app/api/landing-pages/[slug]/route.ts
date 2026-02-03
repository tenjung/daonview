import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: slug로 특정 랜딩페이지 조회 (조회수 증가)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // 랜딩페이지 조회
    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '랜딩페이지를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 조회수 증가 (비동기, 에러 무시)
    void supabase
      .from('landing_pages')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    return NextResponse.json({ landingPage: data });
  } catch (error) {
    console.error('GET 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PUT: 랜딩페이지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, inputData, generatedContent, published } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title) updateData.title = title;
    if (inputData) updateData.input_data = inputData;
    if (generatedContent) updateData.ai_generated_content = generatedContent;
    if (published !== undefined) updateData.published = published;

    const { data, error } = await supabase
      .from('landing_pages')
      .update(updateData)
      .eq('slug', slug)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('랜딩페이지 수정 오류:', error);
      return NextResponse.json({ error: '랜딩페이지를 수정하는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '권한이 없거나 랜딩페이지를 찾을 수 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({ landingPage: data });
  } catch (error) {
    console.error('PUT 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE: 랜딩페이지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('slug', slug)
      .eq('user_id', user.id);

    if (error) {
      console.error('랜딩페이지 삭제 오류:', error);
      return NextResponse.json({ error: '랜딩페이지를 삭제하는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
