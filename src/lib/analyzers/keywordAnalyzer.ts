// 키워드 분석 유틸리티
import { Keyword } from '@/types/analysis';

/**
 * 한국어 조사 및 어미 제거 (단순화된 형태소 분석)
 */
function cleanKoreanWord(word: string): string {
  // 제거할 조사 및 어미 목록 (가장 흔한 것들)
  const josa = /(입니다|은|는|이|가|을|를|과|와|의|로|으로|에|에서|하고|까지|부터|요|다)$/;
  return word.replace(josa, '');
}

/**
 * 한글 키워드 추출 (고도화 버전)
 */
function extractKeywords(text: string): string[] {
  // 특수문자 제거 및 공백 기준 분리
  const rawWords = text.split(/\s+/);
  const words: string[] = [];

  for (const raw of rawWords) {
    // 한글만 남기기
    const onlyKorean = raw.replace(/[^\uAC00-\uD7A3]/g, '');
    if (onlyKorean.length < 2) continue;

    // 조사 제거
    const cleaned = cleanKoreanWord(onlyKorean);
    if (cleaned.length >= 2) {
      words.push(cleaned);
    }
  }

  // 복합 키워드 분석 (N-gram)
  // 예: "동국"과 "알부민"이 연달아 나오면 "동국 알부민" 추출
  const compoundWords: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    // 두 단어 조합
    const pair = `${words[i]} ${words[i + 1]}`;
    compoundWords.push(pair);
  }

  return [...words, ...compoundWords];
}

/**
 * 불용어 필터링 (일반적인 단어 제거)
 */
const STOP_WORDS = new Set([
  '오늘', '네이버', '블로그', '포스팅', '정보', '내용', '진짜', '정말', 
  '너무', '매우', '아주', '생각', '사람', '이것', '저것', '그것', 
  '우리', '저희', '때문', '정도', '조금', '많이', '하루', '이번',
  '어제', '내일', '지금', '이제', '항상', '가끔', '전혀', '별로',
  '대해', '대한', '관한', '통해', '위해', '관련', '추천', '인기',
  '리뷰', '후기', '사용', '구매', '가격', '방법', '이유'
]);

// ... 기존 코드는 유지하되 analyzeKeywords 함수 내부 로직 수정 ...

export function analyzeKeywords(text: string): {
  primary: Keyword[];
  secondary: Keyword[];
} {
  // 1. 키워드 추출 (복합어 포함)
  const allWords = extractKeywords(text);
  
  // 2. 불용어 제거
  const filteredWords = allWords.filter(word => !STOP_WORDS.has(word));
  
  // 3. 빈도 및 가중치 계산
  const frequency = new Map<string, number>();
  filteredWords.forEach(word => {
    // 복합어(공백 포함)에는 더 높은 가중치 부여
    const weight = word.includes(' ') ? 2 : 1;
    frequency.set(word, (frequency.get(word) || 0) + weight);
  });
  
  // 4. TF-IDF 계산 (단순화된 버전)
  const totalWeight = Array.from(frequency.values()).reduce((a, b) => a + b, 0);
  const tfidf = new Map<string, number>();
  
  frequency.forEach((weight, word) => {
    const tf = weight / totalWeight;
    const idf = Math.log(totalWeight / weight);
    tfidf.set(word, tf * idf);
  });
  
  // 5. 대표 키워드 (TF-IDF 상위 5개)
  // 복합어를 우선적으로 상위에 노출하도록 유도
  const primary: Keyword[] = Array.from(tfidf.entries())
    .sort((a, b) => {
      // 복합어 우선 순위
      const aIsCompound = a[0].includes(' ') ? 1 : 0;
      const bIsCompound = b[0].includes(' ') ? 1 : 0;
      if (aIsCompound !== bIsCompound) return bIsCompound - aIsCompound;
      return b[1] - a[1];
    })
    .slice(0, 5)
    .map(([word, score]) => ({
      word,
      count: Math.floor(frequency.get(word) || 0),
      score: Math.round(score * 100) / 100,
    }));
  
  // 6. 세부 키워드 (단일 단어 위주)
  const primaryWords = new Set(primary.map(k => k.word));
  const secondary: Keyword[] = Array.from(frequency.entries())
    .filter(([word]) => !primaryWords.has(word) && !word.includes(' '))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({
      word,
      count,
    }));
  
  return {
    primary,
    secondary,
  };
}


/**
 * 키워드 밀도 계산 (%)
 */
export function calculateKeywordDensity(
  keywords: Keyword[],
  totalWords: number
): number {
  const totalKeywordCount = keywords.reduce((sum, k) => sum + k.count, 0);
  return Math.round((totalKeywordCount / totalWords) * 100 * 10) / 10;
}
