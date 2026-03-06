// 키워드 분석 유틸리티
import { Keyword } from '@/types/analysis';
import { generateWithGemini } from '@/lib/services/googleAI';

/**
 * AI 기반 한글 키워드 분석 (Gemini API 활용)
 */
export async function analyzeKeywords(text: string): Promise<{
  primary: Keyword[];
  secondary: Keyword[];
  seoAdvice: string;
}> {
  // 텍스트가 너무 긴 경우 5000자로 절단 (토큰 절약 및 타임아웃 방지)
  const contentToAnalyze = text.length > 5000 ? text.substring(0, 5000) + '...' : text;

  const prompt = `
당신은 현업 1타 네이버 블로그 SEO 최고 책임자이자 실무 코치입니다.
아래 제공된 블로그 본문 텍스트를 읽고, **뻔한 교과서적인 이야기(제목에 키워드 넣어라, 대체 텍스트 삽입해라, 꾸준히 작성해라 등)는 철저히 배제**해주세요. 오직 본문의 실제 내용과 문맥에만 집중하여 날카롭고 구체적인 피드백을 제공해야 합니다.

[분석 기준 및 핵심 목표]
1. 불용어("오늘", "너무", "진짜")와 단순 조사, 어미는 배제하고 사용자가 실제로 네이버 검색창에 타이핑할 만한 "진짜 검색어" 조합을 찾아내세요.
2. Primary(메인 핵심 키워드) 5개, Secondary(관련 세부 키워드) 10~15개를 추출.
3. **[핵심]** 피드백(seoAdvice)은 일반적인 AI 답변이 아닌, 바로 써먹을 수 있는 "실무 코칭"이어야 합니다. 반드시 아래 2가지 단락으로만 짧고 굵게 마크다운으로 작성하세요.

   **🔍 키워드 타겟팅 진단**
   - 본문에 사용된 키워드가 얼마나 경쟁력 있고 구체적인지 짧은 평가 및 보완점 (예: 광범위한 단어 대신 지역명이나 세부 타겟이 포함된 뾰족한 키워드로 좁히라는 식의 조언)

   **📝 포스팅 스타일 & 체류시간 코칭**
   - 현재 본문의 전개 방식, 문맥을 평가하고 **"어떻게 해야 방문자가 뒤로가기를 누르지 않고 스크롤을 끝까지 내려 오래 글을 보게 할지(체류 시간 확보 전략)"**에 대한 실질적인 글쓰기 팁 (예: 도입부 이탈 방지 훅, 정보의 구조화, 타업체 비교분석 추가 등)

[출력 형식 (반드시 유효한 JSON 포맷만 출력할 것)]
{
  "primary": [
    {"word": "핵심키워드1", "count": 예상반복노출수(정수), "score": 중요도점수(0.1 ~ 1.0)}
  ],
  "secondary": [
    {"word": "세부키워드1", "count": 예상빈도(정수)}
  ],
  "seoAdvice": "여기에 🔍 [키워드 타겟팅 진단] 및 📝 [포스팅 스타일 & 체류시간 코칭]의 마크다운 형식 피드백 작성 (핵심만 짧고 명확하게 명시)"
}

[블로그 본문 데이터]
${contentToAnalyze}
  `;

  try {
    const aiResult = await generateWithGemini(prompt, true);
    
    // AI 파싱 실패나 정규화되지 않은 응답 형태 방어
    const primary = Array.isArray(aiResult?.primary) 
      ? aiResult.primary.slice(0, 5).map((e: any) => ({
          word: e.word || '키워드',
          count: typeof e.count === 'number' ? e.count : 5,
          score: typeof e.score === 'number' ? e.score : 0.8
        }))
      : [];

    const secondary = Array.isArray(aiResult?.secondary)
      ? aiResult.secondary.slice(0, 15).map((e: any) => ({
          word: e.word || '세부키워드',
          count: typeof e.count === 'number' ? e.count : 2
        }))
      : [];

    const seoAdvice = aiResult?.seoAdvice || 'SEO 조언을 생성하는 데 실패했습니다.';

    // 만약 AI가 결과를 못 가져왔을 경우 대비
    if (primary.length === 0) {
      throw new Error('AI 분석 결과가 비어있습니다.');
    }

    return { primary, secondary, seoAdvice };
  } catch (error) {
    console.error('AI 키워드 추출 실패, 기본값 반환:', error);
    
    // API 장애 등의 상황 발생 시 Fallback (기존 방식 유지보다는 간단하게 처리)
    return {
      primary: [
        { word: '분석 지연됨', count: 1, score: 0.5 }
      ],
      secondary: [],
      seoAdvice: '현재 트래픽 초과 등의 이유로 AI SEO 피드백을 받아오지 못했습니다. 잠시 후 다시 시도해주세요.'
    };
  }
}

/**
 * 키워드 밀도 계산 (%)
 */
export function calculateKeywordDensity(
  keywords: Keyword[],
  totalWords: number
): number {
  if (totalWords <= 0) return 0;
  const totalKeywordCount = keywords.reduce((sum, k) => sum + k.count, 0);
  return Math.round((totalKeywordCount / totalWords) * 100 * 10) / 10;
}
