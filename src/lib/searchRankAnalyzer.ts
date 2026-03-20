import axios from 'axios';

/**
 * 검색 순위 정보
 */
export interface SearchRanking {
    keyword: string;    // 검색 키워드
    rank: number;       // 순위 (0 = 100위 밖)
    found: boolean;     // 검색 결과에서 발견 여부
}

/**
 * 네이버 검색 API 응답 (블로그 검색)
 */
interface NaverBlogSearchResponse {
    items: Array<{
        title: string;
        link: string;
        description: string;
        bloggername: string;
        bloggerlink: string;
        postdate: string;
    }>;
    total: number;
    start: number;
    display: number;
}

/**
 * 네이버 블로그 검색 API로 순위 확인
 * @param keyword 검색 키워드
 * @param blogId 블로그 ID
 */
export async function searchNaverBlog(
    keyword: string, 
    blogId: string
): Promise<SearchRanking> {
    try {
        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.warn('[SearchRank] Naver API credentials not found, skipping search ranking');
            return {
                keyword,
                rank: 0,
                found: false
            };
        }

        console.log(`[SearchRank] Searching for keyword: "${keyword}"`);

        // 네이버 블로그 검색 API 호출
        const searchUrl = `https://openapi.naver.com/v1/search/blog.json`;
        const response = await axios.get<NaverBlogSearchResponse>(searchUrl, {
            params: {
                query: keyword,
                display: 100,  // 최대 100개
                sort: 'sim'    // 정확도순 (sim) 또는 최신순 (date)
            },
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            },
            timeout: 10000
        });

        const items = response.data.items;
        console.log(`[SearchRank] Found ${items.length} results for "${keyword}"`);

        // 블로그 ID로 순위 찾기
        const rank = items.findIndex(item => {
            // bloggerlink에서 블로그 ID 추출
            const itemBlogId = item.bloggerlink.split('/').pop();
            return itemBlogId === blogId || item.link.includes(blogId);
        }) + 1; // findIndex는 0부터 시작하므로 +1

        if (rank > 0) {
            console.log(`[SearchRank] ✅ Found at rank ${rank} for "${keyword}"`);
        } else {
            console.log(`[SearchRank] ❌ Not found in top 100 for "${keyword}"`);
        }

        return {
            keyword,
            rank,
            found: rank > 0
        };

    } catch (error: any) {
        console.error(`[SearchRank] Error searching for "${keyword}":`, error.message);
        
        // API 에러는 무시하고 기본값 반환
        return {
            keyword,
            rank: 0,
            found: false
        };
    }
}

/**
 * 여러 키워드로 검색 순위 확인
 * @param keywords 검색 키워드 목록
 * @param blogId 블로그 ID
 * @param delayMs 각 요청 사이 대기 시간 (ms)
 */
export async function searchMultipleKeywords(
    keywords: string[], 
    blogId: string,
    delayMs: number = 1000
): Promise<SearchRanking[]> {
    const rankings: SearchRanking[] = [];

    for (const keyword of keywords) {
        const ranking = await searchNaverBlog(keyword, blogId);
        rankings.push(ranking);

        // API 호출 제한 방지를 위한 대기
        if (keywords.indexOf(keyword) < keywords.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return rankings;
}

/**
 * 검색 순위 점수 계산
 * @param rankings 검색 순위 목록
 */
export function calculateSearchRankScore(rankings: SearchRanking[]): number {
    if (rankings.length === 0) return 0;

    // 순위가 있는 것만 필터링
    const validRankings = rankings.filter(r => r.found && r.rank > 0);
    
    if (validRankings.length === 0) return 0;

    // 평균 순위 계산
    const avgRank = validRankings.reduce((sum, r) => sum + r.rank, 0) / validRankings.length;

    // 순위에 따른 점수 (20점 만점)
    if (avgRank <= 10) return 20;       // 1~10위: 20점
    if (avgRank <= 30) return 15;       // 11~30위: 15점
    if (avgRank <= 50) return 10;       // 31~50위: 10점
    if (avgRank <= 100) return 5;       // 51~100위: 5점
    
    return 0;
}

/**
 * 평균 검색 순위 계산
 * @param rankings 검색 순위 목록
 */
export function calculateAverageRank(rankings: SearchRanking[]): number {
    const validRankings = rankings.filter(r => r.found && r.rank > 0);
    
    if (validRankings.length === 0) return 0;

    const avgRank = validRankings.reduce((sum, r) => sum + r.rank, 0) / validRankings.length;
    
    return Math.round(avgRank * 10) / 10; // 소수점 1자리
}
