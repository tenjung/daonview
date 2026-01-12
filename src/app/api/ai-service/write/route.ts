import { NextRequest, NextResponse } from 'next/server';
import { generateAnalyticPrompt, generateFullPostPrompt } from '@/lib/ai/blogPrompts';
import { generateWithGemini } from '@/lib/services/googleAI';
import { fetchNaverPlaceDetails } from '@/lib/services/naverPlace';
import { removeAIPatterns } from '@/lib/utils/aiToneRemover';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, storeName, menuItems, memo, selectedTitle, verifiedInfo, 
      imageCount, campaignGuide, guideImages 
    } = body;

    // API Key 존재 여부 확인
    const hasGoogleAIKey = !!process.env.GOOGLE_AI_API_KEY;
    const hasNaverKey = !!process.env.NAVER_CLIENT_ID && !!process.env.NAVER_CLIENT_SECRET;

    // 1. 분석 단계 (키워드/제목 추천 + 네이버 장소 정보 불러오기)
    if (action === 'analyze') {
      let naverInfo = null;
      
      // 네이버 장소 정보 불러오기
      if (hasNaverKey && storeName) {
        naverInfo = await fetchNaverPlaceDetails(storeName);
      }

      // Gemini AI를 사용하여 분석 및 추천 생성
      if (hasGoogleAIKey) {
        const prompt = generateAnalyticPrompt(storeName, menuItems, memo, campaignGuide);
        const aiResponse = await generateWithGemini(prompt, true, guideImages || []);
        
        return NextResponse.json({
          ...aiResponse,
          verifiedInfo: naverInfo || {
            name: "정보 없음",
            address: "네이버에서 정보를 불러올 수 없습니다. (매장명을 확인해 주세요)",
            hours: "영업시간 정보 없음",
            isVerified: false
          }
        });
      }

      // [Fallback Mock Response] AI API 키가 없을 경우
      return NextResponse.json({
        category: "맛집 > 한식",
        keywords: [
          { keyword: `${storeName} 추천`, searchVolume: "HIGH" },
          { keyword: "부천 한식 맛집", searchVolume: "MEDIUM" },
          { keyword: "부모님 모시기 좋은 식당", searchVolume: "HIGH" }
        ],
        titles: [
          { title: `[${storeName}] 직접 가보고 깜짝 놀란 찐후기 (제목 예시)`, seo_score: 95, reason: "클릭률 유도형" }
        ],
        verifiedInfo: naverInfo || {
          name: storeName,
          address: "네이버 API 키가 설정되면 실제 주소를 불러옵니다.",
          hours: "11:00 - 22:00 (예시)",
          isVerified: false
        }
      });
    }

    // 2. 본문 생성 단계 (Google Gemini 사용)
    if (action === 'generate') {
      if (hasGoogleAIKey) {
        const prompt = generateFullPostPrompt(
          storeName, menuItems, memo, selectedTitle, verifiedInfo, 
          imageCount || 0, campaignGuide
        );
        const aiResult = await generateWithGemini(prompt, true, guideImages || []);
        
        // AI 톤 제거 필터 적용
        if (aiResult.content) {
          aiResult.content = removeAIPatterns(aiResult.content);
        }
        
        return NextResponse.json(aiResult);
      }

      // [Fallback Mock Response]
      return NextResponse.json({
        content: `# ${selectedTitle}\n\n구글 AI API 키를 설정하면 실제로 글이 생성됩니다.\n\n현재는 미리보기용 텍스트입니다.`,
        seo_keywords_used: [storeName],
        meta_description: "미리보기 설명입니다.",
        image_positions: []
      });
    }

    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}



