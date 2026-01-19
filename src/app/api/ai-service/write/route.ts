import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/services/googleAI';
import { generateAnalyticPrompt, generateFullPostPrompt } from '@/lib/ai/blogPrompts';
import { fetchNaverPlaceDetails } from '@/lib/services/naverPlace';

export async function POST(request: NextRequest) {
  try {
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
      imageCount
    } = body;

    if (action === 'analyze') {
      const prompt = generateAnalyticPrompt(storeName, menuItems, memo, selectedTopic, campaignGuide);
      
      // AI 분석과 매장 정보 조회를 병렬로 진행
      const [aiResponse, placeInfo] = await Promise.all([
        generateWithGemini(prompt, true, guideImages || []),
        fetchNaverPlaceDetails(storeName)
      ]);

      // 데이터 정규화 (AI가 가끔 문자열 배열로 줄 때를 대비)
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
        verifiedInfo: placeInfo || {
          name: storeName,
          address: "정보 없음",
          isVerified: false
        }
      });
    }

    if (action === 'generate') {
      const prompt = generateFullPostPrompt(
        storeName, 
        menuItems, 
        memo, 
        title, 
        clientVerifiedInfo, 
        selectedTone,
        selectedCategories,
        editableKeywords,
        imageCount,
        campaignGuide
      );
      
      const aiResponse = await generateWithGemini(prompt, true, guideImages || []);
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
