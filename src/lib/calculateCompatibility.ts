/**
 * 캠페인과 인플루언서의 적합도를 계산하는 유틸리티
 */

// 카테고리 키워드 매핑 (캠페인 등록 폼 카테고리: 맛집, 뷰티, 숙박, 생활, 서비스, 유아동, 디지털/가전, 기타)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    '맛집': ['맛집', '음식', '요리', '레시피', '카페', '디저트', '베이커리', '먹방', '레스토랑', '식당'],
    '뷰티': ['뷰티', '화장품', '메이크업', '스킨케어', '코스메틱', '미용', '헤어', '네일', '향수'],
    '숙박': ['숙박', '호텔', '펜션', '리조트', '게스트하우스', '에어비앤비', '여행', '관광'],
    '생활': ['생활', '일상', '라이프', '홈데코', '인테리어', '가구', '주방', '청소', '수납'],
    '서비스': ['서비스', '교육', '학원', '강의', '클래스', '레슨', '컨설팅', '상담'],
    '유아동': ['유아동', '육아', '아기', '유아', '임신', '출산', '어린이', '키즈', '베이비', '장난감'],
    '디지털/가전': ['디지털', '가전', 'IT', '테크', '기술', '개발', '프로그래밍', '앱', '소프트웨어', '가젯', '전자제품'],
    '기타': ['기타', '취미', '운동', '피트니스', '다이어트', '헬스', '요가', '웰빙', '반려동물', '펫', '자동차'],
};

export interface CompatibilityResult {
    score: number; // 0-100
    grade: 'S급' | 'A급' | 'B급' | 'C급' | 'D급';
    matchedCategories: string[]; // 매칭된 카테고리
    reason: string; // 적합도 이유
}

/**
 * 캠페인 제목에서 키워드를 추출하여 카테고리 매칭
 */
function extractCategoriesFromTitle(title: string): string[] {
    const matchedCategories: string[] = [];
    const titleLower = title.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (titleLower.includes(keyword.toLowerCase())) {
                matchedCategories.push(category);
                break; // 한 카테고리당 한 번만 매칭
            }
        }
    }

    return matchedCategories;
}

/**
 * 점수에 따른 등급 산출
 */
function getGradeFromScore(score: number): CompatibilityResult['grade'] {
    if (score >= 80) return 'S급';
    if (score >= 60) return 'A급';
    if (score >= 40) return 'B급';
    if (score >= 20) return 'C급';
    return 'D급';
}

/**
 * 캠페인과 인플루언서의 적합도 계산
 * @param campaignTitle 캠페인 제목 (category가 없을 때 키워드 추출용)
 * @param influencerCategories 인플루언서의 주요 카테고리 배열
 * @param campaignCategory 캠페인 카테고리 (우선 사용)
 * @returns 적합도 결과
 */
export function calculateCompatibility(
    campaignTitle: string,
    influencerCategories: string[],
    campaignCategory?: string
): CompatibilityResult {
    // 인플루언서 카테고리가 없는 경우
    if (!influencerCategories || influencerCategories.length === 0) {
        return {
            score: 0,
            grade: 'D급',
            matchedCategories: [],
            reason: '블로그 카테고리 정보 없음',
        };
    }

    // 캠페인 카테고리 결정: DB 카테고리 우선, 없으면 제목에서 추출
    let campaignCategories: string[] = [];

    if (campaignCategory) {
        // DB에 저장된 카테고리 사용
        campaignCategories = [campaignCategory];
    } else {
        // 캠페인 제목에서 카테고리 추출
        campaignCategories = extractCategoriesFromTitle(campaignTitle);
    }

    // 캠페인 카테고리가 추출되지 않은 경우 (기본 점수)
    if (campaignCategories.length === 0) {
        return {
            score: 50,
            grade: 'B급',
            matchedCategories: [],
            reason: '캠페인 카테고리 미분류 (기본 점수)',
        };
    }

    // 매칭된 카테고리 찾기
    const matchedCategories: string[] = [];

    for (const campaignCat of campaignCategories) {
        for (const influencerCat of influencerCategories) {
            // 직접 매칭
            if (campaignCat === influencerCat) {
                matchedCategories.push(campaignCat);
                continue;
            }

            // 키워드 기반 매칭 (인플루언서 카테고리가 캠페인 키워드에 포함되는지)
            const campaignKeywords = CATEGORY_KEYWORDS[campaignCat] || [];
            if (campaignKeywords.some(kw => influencerCat.toLowerCase().includes(kw.toLowerCase()))) {
                matchedCategories.push(campaignCat);
            }
        }
    }

    // 점수 계산
    let score = 0;

    if (matchedCategories.length > 0) {
        // 매칭률 기반 점수 (최대 100점)
        const matchRate = matchedCategories.length / campaignCategories.length;
        score = Math.min(100, Math.round(matchRate * 100));

        // 완전 매칭 보너스
        if (matchedCategories.length === campaignCategories.length) {
            score = Math.min(100, score + 10);
        }
    } else {
        // 매칭 없음 (낮은 점수)
        score = 15;
    }

    const grade = getGradeFromScore(score);

    // 이유 생성
    let reason = '';
    if (matchedCategories.length > 0) {
        reason = `${matchedCategories.join(', ')} 카테고리 매칭`;
    } else {
        reason = '캠페인과 블로그 카테고리 불일치';
    }

    return {
        score,
        grade,
        matchedCategories: [...new Set(matchedCategories)], // 중복 제거
        reason,
    };
}
