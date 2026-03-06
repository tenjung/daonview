import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/services/googleAI';
import { generateAnalyticPrompt, generateFullPostPrompt } from '@/lib/ai/blogPrompts';
import { fetchNaverPlaceDetails } from '@/lib/services/naverPlace';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      action,
      storeName,
      menuItems,
      memo,
      campaignGuide,
      guideImages,
      selectedTopic,
      selectedTone,
      selectedCategories,
      editableKeywords,
      title,
      verifiedInfo: clientVerifiedInfo,
      imageCount,
      postImages // 실제 포스팅용 이미지
    } = body;

    // ... (analyze and verify-place logic remains same)
    if (action === 'analyze') {
      const prompt = generateAnalyticPrompt(storeName, menuItems, memo, selectedTopic, campaignGuide);
      const [aiResponse, placeList] = await Promise.all([
        generateWithGemini(prompt, true, guideImages || []),
        fetchNaverPlaceDetails(storeName)
      ]);
      const normalizedKeywords = (aiResponse.keywords || []).map((k: any) =>
        typeof k === 'string' ? { keyword: k, searchVolume: "MEDIUM", type: "DETAIL", status: "VERIFIED" } : k
      );
      const normalizedTitles = (aiResponse.titles || []).map((t: any) =>
        typeof t === 'string' ? { title: t, seo_score: 90, reason: "AI 추천" } : t
      );
      return NextResponse.json({
        ...aiResponse,
        keywords: normalizedKeywords,
        titles: normalizedTitles,
        placeList: placeList,
        verifiedInfo: placeList.length === 1 ? placeList[0] : (placeList.length > 1 ? null : {
          name: storeName, address: "정보 없음", isVerified: false
        })
      });
    }

    if (action === 'verify-place') {
      const placeList = await fetchNaverPlaceDetails(storeName);
      return NextResponse.json({
        placeList: placeList,
        verifiedInfo: placeList.length === 1 ? placeList[0] : null
      });
    }

    if (action === 'generate') {
      if (!user) {
        return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
      }

      // Quota check
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const kstToday = kstDate.toISOString().split('T')[0];
      
      const { count } = await supabase
        .from('ai_writing_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${kstToday}T00:00:00+09:00`)
        .lt('created_at', `${kstToday}T23:59:59+09:00`);

      if (count !== null && count >= 2) {
        return NextResponse.json({ error: '일일 AI 글작성 도우미 제한 횟수(2회)를 모두 소모했습니다. 내일 다시 이용해주세요.' }, { status: 429 });
      }

      const postImagesCount = postImages?.length || 0;
      const guideImagesCount = guideImages?.length || 0;

      const prompt = generateFullPostPrompt(
        storeName,
        menuItems,
        memo,
        title,
        clientVerifiedInfo,
        selectedTone,
        selectedCategories,
        editableKeywords,
        postImagesCount,
        guideImagesCount,
        campaignGuide
      );

      const allImages = [...(guideImages || []), ...(postImages || [])];
      const aiResponse = await generateWithGemini(prompt, true, allImages);

      // 성공적으로 분석되었으면 로깅
      const { error: insertError } = await supabase.from('ai_writing_logs').insert({
        user_id: user.id
      });
      if (insertError) {
        console.warn('ai_writing_logs 테이블 누락 혹은 로깅 실패:', insertError);
      }

      return NextResponse.json(aiResponse);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({
      error: error.message || "AI 생성 중 오류가 발생했습니다."
    }, { status: 500 });
  }
}
