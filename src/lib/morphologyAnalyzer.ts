// @ts-ignore - hangul-js doesn't have TypeScript definitions
import Hangul from 'hangul-js';

/**
 * 형태소 분석 결과
 */
export interface MorphologyAnalysis {
    nouns: string[];           // 명사 목록
    uniqueNouns: string[];     // 고유 명사 목록 (중복 제거)
    nounCount: number;         // 총 명사 개수
    uniqueNounCount: number;   // 고유 명사 개수
    keywords: string[];        // 주요 키워드 (빈도수 기준 상위 5개)
}

/**
 * 한국어 텍스트 형태소 분석
 * @param text 분석할 텍스트
 */
export function analyzeMorphology(text: string): MorphologyAnalysis {
    // 텍스트 정제
    const cleanedText = text
        .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')  // 특수문자 제거
        .replace(/\s+/g, ' ')                      // 연속 공백 제거
        .trim();

    // 단어 추출 (공백 기준)
    const words = cleanedText.split(/\s+/);

    // 명사 추출 (간단한 휴리스틱: 2글자 이상 한글 단어)
    const nouns = words.filter(word => {
        // 한글만 포함하고 2글자 이상
        return /^[가-힣]{2,}$/.test(word);
    });

    // 고유 명사 (중복 제거)
    const uniqueNouns = Array.from(new Set(nouns));

    // 명사 빈도수 계산
    const nounFrequency: Record<string, number> = {};
    nouns.forEach(noun => {
        nounFrequency[noun] = (nounFrequency[noun] || 0) + 1;
    });

    // 빈도수 기준 상위 5개 키워드 추출
    const keywords = Object.entries(nounFrequency)
        .sort((a, b) => b[1] - a[1])  // 빈도수 내림차순
        .slice(0, 5)
        .map(([noun]) => noun);

    return {
        nouns,
        uniqueNouns,
        nounCount: nouns.length,
        uniqueNounCount: uniqueNouns.length,
        keywords
    };
}

/**
 * 검색용 키워드 추출 (2~3단어 조합)
 * @param text 분석할 텍스트
 * @param limit 추출할 키워드 개수
 */
export function extractSearchKeywords(text: string, limit: number = 3): string[] {
    const analysis = analyzeMorphology(text);
    const keywords: string[] = [];

    // 1. 단일 키워드 (빈도수 높은 명사)
    keywords.push(...analysis.keywords.slice(0, 2));

    // 2. 2단어 조합 키워드 생성
    const topNouns = analysis.keywords.slice(0, 4);
    for (let i = 0; i < topNouns.length - 1; i++) {
        const combined = `${topNouns[i]} ${topNouns[i + 1]}`;
        keywords.push(combined);
        if (keywords.length >= limit) break;
    }

    // 중복 제거 및 제한
    return Array.from(new Set(keywords)).slice(0, limit);
}

/**
 * 텍스트의 정보 밀도 계산
 * @param analysis 형태소 분석 결과
 * @param textLength 전체 텍스트 길이
 */
export function calculateInformationDensity(
    analysis: MorphologyAnalysis, 
    textLength: number
): number {
    if (textLength === 0) return 0;
    
    // 고유 명사 개수 / 전체 글자 수
    const density = analysis.uniqueNounCount / textLength;
    
    return Math.round(density * 10000) / 10000; // 소수점 4자리
}

/**
 * 여러 포스트의 형태소 분석 결과 병합
 * @param analyses 분석 결과 배열
 */
export function mergeMorphologyAnalyses(analyses: MorphologyAnalysis[]): MorphologyAnalysis {
    if (analyses.length === 0) {
        return {
            nouns: [],
            uniqueNouns: [],
            nounCount: 0,
            uniqueNounCount: 0,
            keywords: []
        };
    }

    // 모든 명사 합치기
    const allNouns = analyses.flatMap(a => a.nouns);
    const allUniqueNouns = Array.from(new Set(allNouns));

    // 전체 빈도수 계산
    const nounFrequency: Record<string, number> = {};
    allNouns.forEach(noun => {
        nounFrequency[noun] = (nounFrequency[noun] || 0) + 1;
    });

    // 상위 키워드 추출
    const keywords = Object.entries(nounFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([noun]) => noun);

    return {
        nouns: allNouns,
        uniqueNouns: allUniqueNouns,
        nounCount: allNouns.length,
        uniqueNounCount: allUniqueNouns.length,
        keywords
    };
}
