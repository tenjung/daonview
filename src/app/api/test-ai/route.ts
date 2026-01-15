import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/services/googleAI';
import { generateAnalyticPrompt, generateFullPostPrompt } from '@/lib/ai/blogPrompts';

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
      selectedTopic,      // 추가
      selectedTone,       // 추가
      selectedCategories,  // 추가
      editableKeywords,   // 추가
      title,
      verifiedInfo,
      imageCount
    } = body;

    // 1. 분석 및 추천 생성 (STEP 1 -> 2)
    if (action === 'analyze') {
      const prompt = generateAnalyticPrompt(storeName, menuItems, memo, selectedTopic, campaignGuide);
      const aiResponse = await generateWithGemini(prompt, true, guideImages || []);
      
      return NextResponse.json({
        ...aiResponse,
        verifiedInfo: {
          name: storeName,
          address: "정보를 불러오는 중...",
          isVerified: false
        }
      });
    }

    // 2. 전체 글 생성 (STEP 2 -> 3)
    if (action === 'generate') {
      const prompt = generateFullPostPrompt(
        storeName, 
        menuItems, 
        memo, 
        title, 
        verifiedInfo, 
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
