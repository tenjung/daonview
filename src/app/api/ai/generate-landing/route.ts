import { NextRequest, NextResponse } from 'next/server';
import { generateInfluencerPrompt, generateBusinessPrompt } from '@/lib/ai/landingPagePrompts';
import { LandingPageInput, AIGeneratedContent } from '@/types/landingPage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input: LandingPageInput = body.input;

    if (!input || !input.targetType) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // API 키 확인
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'AI 서비스 설정 오류' },
        { status: 500 }
      );
    }

    // 타입에 따라 적절한 프롬프트 선택
    const prompt = input.targetType === 'INFLUENCER'
      ? generateInfluencerPrompt(input)
      : generateBusinessPrompt(input);

    // Gemini REST API 호출
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error Response:', result);
      return NextResponse.json(
        { error: result.error?.message || 'AI API 호출 실패' },
        { status: 500 }
      );
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('AI 응답 본문이 비어 있습니다.');
      return NextResponse.json(
        { error: 'AI 응답이 비어 있습니다.' },
        { status: 500 }
      );
    }

    // JSON 파싱
    let generatedContent: AIGeneratedContent;
    try {
      // 코드 블록 제거 (```json ... ``` 형식 처리)
      let cleanedText = text;
      if (cleanedText.includes('```')) {
        cleanedText = cleanedText.split(/```(?:json)?/)[1]?.split('```')[0]?.trim() || text;
      }
      
      // 만약 여전히 파싱 실패하면 { } 구간만 찾기
      try {
        generatedContent = JSON.parse(cleanedText);
      } catch {
        const match = cleanedText.match(/\{[\s\S]*\}/);
        if (match) {
          generatedContent = JSON.parse(match[0]);
        } else {
          throw new Error('JSON 파싱 실패');
        }
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.error('원본 응답:', text);
      return NextResponse.json(
        { error: 'AI 응답을 파싱하는 중 오류가 발생했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 유효성 검사
    if (!generatedContent.hero || !generatedContent.stats || !generatedContent.portfolio) {
      console.error('AI 생성 콘텐츠 유효성 검사 실패:', generatedContent);
      return NextResponse.json(
        { error: 'AI가 생성한 콘텐츠가 올바르지 않습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: generatedContent });
  } catch (error: any) {
    console.error('AI 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || 'AI 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
