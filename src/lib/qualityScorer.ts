import { ContentAnalysis } from './contentAnalyzer';
import { MorphologyAnalysis } from './morphologyAnalyzer';
import { SearchRanking } from './searchRankAnalyzer';

/**
 * 품질 점수 상세 내역
 */
export interface QualityScoreBreakdown {
    textLengthScore: number;      // 본문 길이 점수 (35점)
    imageCountScore: number;      // 이미지 개수 점수 (15점)
    contentDensityScore: number;  // 콘텐츠 밀도 점수 (15점)
    morphologyScore: number;      // 형태소 다양성 점수 (15점)
    searchRankScore: number;      // 검색 순위 점수 (20점)
    totalScore: number;           // 총점 (100점)
    grade: string;                // 등급 (S/A/B/C/D)
}

/**
 * 본문 길이 점수 계산 (35점 만점)
 * @param textLength 본문 글자 수
 */
export function calculateTextLengthScore(textLength: number): number {
    if (textLength >= 2000) return 35;
    if (textLength >= 1500) return 28;
    if (textLength >= 1000) return 21;
    if (textLength >= 500) return 14;
    if (textLength >= 300) return 7;
    return 0;
}

/**
 * 이미지 개수 점수 계산 (15점 만점)
 * @param imageCount 이미지 개수
 */
export function calculateImageCountScore(imageCount: number): number {
    if (imageCount >= 10) return 15;
    if (imageCount >= 7) return 12;
    if (imageCount >= 4) return 9;
    if (imageCount >= 2) return 6;
    if (imageCount >= 1) return 3;
    return 0;
}

/**
 * 콘텐츠 밀도 점수 계산 (15점 만점)
 * @param contentDensity 콘텐츠 밀도 (단어/글자 비율)
 */
export function calculateContentDensityScore(contentDensity: number): number {
    if (contentDensity >= 0.4) return 15;
    if (contentDensity >= 0.3) return 12;
    if (contentDensity >= 0.2) return 9;
    if (contentDensity >= 0.1) return 6;
    if (contentDensity >= 0.05) return 3;
    return 0;
}

/**
 * 형태소 다양성 점수 계산 (15점 만점)
 * @param uniqueNounCount 고유 명사 개수
 */
export function calculateMorphologyScore(uniqueNounCount: number): number {
    if (uniqueNounCount >= 50) return 15;
    if (uniqueNounCount >= 30) return 12;
    if (uniqueNounCount >= 20) return 9;
    if (uniqueNounCount >= 10) return 6;
    if (uniqueNounCount >= 5) return 3;
    return 0;
}

/**
 * 검색 순위 점수 계산 (20점 만점)
 * @param rankings 검색 순위 목록
 */
export function calculateSearchRankScoreFromRankings(rankings: SearchRanking[]): number {
    if (rankings.length === 0) return 0;

    const validRankings = rankings.filter(r => r.found && r.rank > 0);
    
    if (validRankings.length === 0) return 0;

    const avgRank = validRankings.reduce((sum, r) => sum + r.rank, 0) / validRankings.length;

    if (avgRank <= 10) return 20;
    if (avgRank <= 30) return 15;
    if (avgRank <= 50) return 10;
    if (avgRank <= 100) return 5;
    
    return 0;
}

/**
 * 종합 품질 점수 계산
 * @param contentAnalysis 콘텐츠 분석 결과
 * @param morphologyAnalysis 형태소 분석 결과
 * @param searchRankings 검색 순위 목록 (선택)
 */
export function calculateQualityScore(
    contentAnalysis: ContentAnalysis,
    morphologyAnalysis: MorphologyAnalysis,
    searchRankings?: SearchRanking[]
): QualityScoreBreakdown {
    // 각 항목별 점수 계산
    const textLengthScore = calculateTextLengthScore(contentAnalysis.textLength);
    const imageCountScore = calculateImageCountScore(contentAnalysis.imageCount);
    const contentDensityScore = calculateContentDensityScore(contentAnalysis.contentDensity);
    const morphologyScore = calculateMorphologyScore(morphologyAnalysis.uniqueNounCount);
    const searchRankScore = searchRankings 
        ? calculateSearchRankScoreFromRankings(searchRankings)
        : 0;

    // 총점 계산
    const totalScore = 
        textLengthScore + 
        imageCountScore + 
        contentDensityScore + 
        morphologyScore + 
        searchRankScore;

    // 등급 판정
    const grade = getGradeFromScore(totalScore);

    return {
        textLengthScore,
        imageCountScore,
        contentDensityScore,
        morphologyScore,
        searchRankScore,
        totalScore,
        grade
    };
}

/**
 * 점수에 따른 등급 판정
 * @param score 총점 (0~100)
 */
export function getGradeFromScore(score: number): string {
    if (score >= 80) return 'S급';
    if (score >= 60) return 'A급';
    if (score >= 40) return 'B급';
    if (score >= 20) return 'C급';
    return 'D급';
}

/**
 * 등급에 따른 색상 클래스 반환
 * @param grade 등급
 */
export function getGradeColor(grade: string): string {
    switch (grade) {
        case 'S급': return 'text-purple-600 bg-purple-100';
        case 'A급': return 'text-blue-600 bg-blue-100';
        case 'B급': return 'text-green-600 bg-green-100';
        case 'C급': return 'text-yellow-600 bg-yellow-100';
        case 'D급': return 'text-gray-600 bg-gray-100';
        default: return 'text-gray-600 bg-gray-100';
    }
}

/**
 * 점수 상세 설명 생성
 * @param breakdown 점수 상세 내역
 */
export function generateScoreDescription(breakdown: QualityScoreBreakdown): string {
    const parts: string[] = [];

    if (breakdown.textLengthScore >= 28) {
        parts.push('풍부한 본문');
    } else if (breakdown.textLengthScore >= 14) {
        parts.push('적절한 본문');
    }

    if (breakdown.imageCountScore >= 12) {
        parts.push('풍부한 이미지');
    } else if (breakdown.imageCountScore >= 6) {
        parts.push('적절한 이미지');
    }

    if (breakdown.contentDensityScore >= 12) {
        parts.push('높은 정보 밀도');
    }

    if (breakdown.morphologyScore >= 12) {
        parts.push('다양한 어휘');
    }

    if (breakdown.searchRankScore >= 15) {
        parts.push('우수한 검색 노출');
    } else if (breakdown.searchRankScore >= 10) {
        parts.push('양호한 검색 노출');
    }

    return parts.length > 0 ? parts.join(', ') : '기본 품질';
}
