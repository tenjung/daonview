import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { generateWithGemini } from '@/lib/services/googleAI';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { region, storeName, productName, campaignType, category } = await req.json();

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Naver API configuration missing' }, { status: 500 });
    }

    // 1. 기초 키워드 생성
    const seedKeyword = campaignType === 'DELIVERY' ? productName : `${region || ''} ${storeName || ''}`.trim();

    // 2. 네이버 검색 API를 통해 현재 연관된 정보 수집 (Local & Blog)
    const [localRes, blogRes] = await Promise.all([
      axios.get('https://openapi.naver.com/v1/search/local.json', {
        params: { query: seedKeyword, display: 5 },
        headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
      }).catch(() => ({ data: { items: [] } })),
      axios.get('https://openapi.naver.com/v1/search/blog.json', {
        params: { query: seedKeyword, display: 10 },
        headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
      }).catch(() => ({ data: { items: [] } }))
    ]);

    const contextData = {
      localItems: localRes.data.items.map((it: any) => ({ title: it.title, category: it.category, address: it.address })),
      blogTitles: blogRes.data.items.map((it: any) => it.title.replace(/<[^>]*>?/gm, ''))
    };

    // 3. 다온 AI (Gemini)를 통한 SEO 키워드 분석 및 추출
    // 네이버 검색 결과 데이터를 바탕으로 최적의 키워드를 제안하도록 프롬프트 구성
    const prompt = `
      네이버 검색 API 결과 데이터:
      ${JSON.stringify(contextData)}

      위 데이터를 바탕으로 다음 캠페인에 대한 네이버 SEO 최적화 키워드를 제안해주세요.
      캠페인 정보:
      - 지역: ${region || '전국'}
      - 상호명/제품명: ${storeName || productName}
      - 캠페인 유형: ${campaignType}

      네이버의 검색 트렌드와 블로그 상위 노출 로직을 고려하여, 
      1. 메인 키워드 (가장 검색량이 많고 타겟팅이 확실한 3~5개)
      2. 서브 키워드 (연관검색어 성격의 세부 키워드 5~8개)
      3. 인스타그램 해시태그 (트렌디한 5~8개)
      를 JSON 형식으로 응답해주세요.

      형식:
      {
        "mainKeywords": ["키워드1", "키워드2", ...],
        "subKeywords": ["키워드1", "키워드2", ...],
        "hashtags": ["#태그1", "#태그2", ...]
      }
    `;

    const aiRecommendation = await generateWithGemini(prompt, true);

    return NextResponse.json(aiRecommendation);
  } catch (error: any) {
    console.error('AI Keyword API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
