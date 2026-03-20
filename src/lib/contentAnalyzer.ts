import { ScrapedContent } from './blogScraper';

/**
 * 콘텐츠 분석 결과
 */
export interface ContentAnalysis {
    textLength: number;        // 전체 글자 수
    wordCount: number;         // 단어 수
    imageCount: number;        // 이미지 개수
    contentDensity: number;    // 콘텐츠 밀도 (단어/글자 비율)
    avgSentenceLength: number; // 평균 문장 길이
}

/**
 * 스크래핑된 콘텐츠 분석
 * @param content 스크래핑된 콘텐츠
 */
export function analyzeContent(content: ScrapedContent): ContentAnalysis {
    const { textContent, textLength, wordCount, imageCount } = content;

    // 콘텐츠 밀도 계산 (단어 수 / 글자 수)
    const contentDensity = textLength > 0 ? wordCount / textLength : 0;

    // 문장 분리 (마침표, 느낌표, 물음표 기준)
    const sentences = textContent.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 
        ? textLength / sentences.length 
        : 0;

    return {
        textLength,
        wordCount,
        imageCount,
        contentDensity: Math.round(contentDensity * 1000) / 1000, // 소수점 3자리
        avgSentenceLength: Math.round(avgSentenceLength)
    };
}

/**
 * 여러 포스트의 평균 분석 결과 계산
 * @param analyses 분석 결과 배열
 */
export function calculateAverageAnalysis(analyses: ContentAnalysis[]): ContentAnalysis {
    if (analyses.length === 0) {
        return {
            textLength: 0,
            wordCount: 0,
            imageCount: 0,
            contentDensity: 0,
            avgSentenceLength: 0
        };
    }

    const sum = analyses.reduce((acc, curr) => ({
        textLength: acc.textLength + curr.textLength,
        wordCount: acc.wordCount + curr.wordCount,
        imageCount: acc.imageCount + curr.imageCount,
        contentDensity: acc.contentDensity + curr.contentDensity,
        avgSentenceLength: acc.avgSentenceLength + curr.avgSentenceLength
    }), {
        textLength: 0,
        wordCount: 0,
        imageCount: 0,
        contentDensity: 0,
        avgSentenceLength: 0
    });

    const count = analyses.length;

    return {
        textLength: Math.round(sum.textLength / count),
        wordCount: Math.round(sum.wordCount / count),
        imageCount: Math.round(sum.imageCount / count),
        contentDensity: Math.round((sum.contentDensity / count) * 1000) / 1000,
        avgSentenceLength: Math.round(sum.avgSentenceLength / count)
    };
}

/**
 * 콘텐츠 품질 등급 판정
 * @param analysis 분석 결과
 */
export function getContentGrade(analysis: ContentAnalysis): {
    grade: string;
    description: string;
} {
    const { textLength, imageCount, contentDensity } = analysis;

    // 종합 점수 계산 (간이 버전)
    let score = 0;

    // 본문 길이 점수
    if (textLength >= 2000) score += 40;
    else if (textLength >= 1500) score += 30;
    else if (textLength >= 1000) score += 20;
    else if (textLength >= 500) score += 10;

    // 이미지 개수 점수
    if (imageCount >= 10) score += 20;
    else if (imageCount >= 7) score += 15;
    else if (imageCount >= 4) score += 10;
    else if (imageCount >= 1) score += 5;

    // 콘텐츠 밀도 점수
    if (contentDensity >= 0.4) score += 20;
    else if (contentDensity >= 0.3) score += 15;
    else if (contentDensity >= 0.2) score += 10;
    else if (contentDensity >= 0.1) score += 5;

    // 등급 판정
    if (score >= 70) {
        return { grade: 'S급', description: '최상위 품질' };
    } else if (score >= 50) {
        return { grade: 'A급', description: '우수한 품질' };
    } else if (score >= 30) {
        return { grade: 'B급', description: '양호한 품질' };
    } else if (score >= 15) {
        return { grade: 'C급', description: '보통 품질' };
    } else {
        return { grade: 'D급', description: '낮은 품질' };
    }
}
