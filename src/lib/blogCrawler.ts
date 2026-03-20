import axios from 'axios';
import * as cheerio from 'cheerio';

export interface BlogStats {
    visitorToday: number;
    visitorTotal: number;
    neighborCount: number;
    recentPosts: PostStats[];
    mainCategories: string[];
}

export interface PostStats {
    title: string;
    url: string;
    date: string;
    likes: number;
    comments: number;
    category?: string;
}

/**
 * 네이버 블로그 통계 크롤링 (간소화 버전)
 * - 확실하게 가져올 수 있는 정보만 수집
 * - 실패 시 기본값 반환으로 안정성 확보
 */
export async function crawlNaverBlog(blogUrl: string): Promise<BlogStats> {
    try {
        const blogId = extractBlogId(blogUrl);
        if (!blogId) {
            throw new Error('Invalid blog URL format');
        }

        console.log(`[Crawl] Starting for blog: ${blogId}`);

        // 데스크톱 버전 사용 (모바일보다 안정적)
        const desktopUrl = `https://blog.naver.com/${blogId}`;
        
        const response = await axios.get(desktopUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 15000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        const bodyText = $('body').text();
        const htmlText = response.data; // 전체 HTML도 확인

        console.log('[Crawl] Page loaded, body text length:', bodyText.length);
        
        // 디버그: HTML 일부 출력 (처음 500자)
        const htmlSnippet = htmlText.substring(0, 500);
        console.log('[Crawl] HTML snippet:', htmlSnippet);
        
        // 디버그: Body 텍스트 일부 출력 (처음 500자)
        const bodySnippet = bodyText.substring(0, 500);
        console.log('[Crawl] Body text snippet:', bodySnippet);

        // 방문자 수 추출 (여러 패턴 시도)
        let visitorToday = 0;
        let visitorTotal = 0;
        let neighborCount = 0;

        // === 오늘 방문자 추출 (다양한 패턴) ===
        const todayPatterns = [
            /오늘\s*(\d+[,\d]*)/,
            /TODAY\s*(\d+[,\d]*)/i,
            /today\s*(\d+[,\d]*)/i,
            /방문\s*오늘\s*(\d+[,\d]*)/,
            /일일\s*방문\s*(\d+[,\d]*)/,
            /"visitorCountToday"\s*:\s*(\d+)/,
            /"todayCount"\s*:\s*(\d+)/,
        ];

        for (const pattern of todayPatterns) {
            const match = bodyText.match(pattern) || htmlText.match(pattern);
            if (match && match[1]) {
                visitorToday = extractNumber(match);
                console.log(`[Crawl] Today visitor matched with pattern: ${pattern}, value: ${match[1]}`);
                break;
            }
        }

        // === 전체 방문자 추출 (다양한 패턴) ===
        const totalPatterns = [
            /전체\s*(\d+[,\d]*)/,
            /TOTAL\s*(\d+[,\d]*)/i,
            /total\s*(\d+[,\d]*)/i,
            /누적\s*방문\s*(\d+[,\d]*)/,
            /총\s*방문\s*(\d+[,\d]*)/,
            /"visitorCountTotal"\s*:\s*(\d+)/,
            /"totalCount"\s*:\s*(\d+)/,
        ];

        for (const pattern of totalPatterns) {
            const match = bodyText.match(pattern) || htmlText.match(pattern);
            if (match && match[1]) {
                visitorTotal = extractNumber(match);
                console.log(`[Crawl] Total visitor matched with pattern: ${pattern}, value: ${match[1]}`);
                break;
            }
        }

        // === 이웃 수 추출 (다양한 패턴) ===
        const neighborPatterns = [
            /이웃\s*(\d+[,\d]*)/,
            /BUDDY\s*(\d+[,\d]*)/i,
            /neighbor\s*(\d+[,\d]*)/i,
            /이웃님\s*(\d+[,\d]*)/,
            /"buddyCount"\s*:\s*(\d+)/,
            /"neighborCount"\s*:\s*(\d+)/,
        ];

        for (const pattern of neighborPatterns) {
            const match = bodyText.match(pattern) || htmlText.match(pattern);
            if (match && match[1]) {
                neighborCount = extractNumber(match);
                console.log(`[Crawl] Neighbor matched with pattern: ${pattern}, value: ${match[1]}`);
                break;
            }
        }

        console.log(`[Crawl] Final extracted - Today: ${visitorToday}, Total: ${visitorTotal}, Neighbors: ${neighborCount}`);

        // 포스팅 정보는 선택적으로 수집 (실패해도 무방)
        let recentPosts: PostStats[] = [];
        let mainCategories: string[] = [];

        try {
            // iframe 내부의 포스트 목록 URL 시도
            const postListUrl = `https://blog.naver.com/PostList.naver?blogId=${blogId}&from=postList&categoryNo=0`;
            const postListResponse = await axios.get(postListUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': desktopUrl
                },
                timeout: 10000
            });

            const $posts = cheerio.load(postListResponse.data);
            const postUrls: string[] = [];

            // 포스트 링크 추출
            $posts('a[href*="PostView"]').each((i, elem) => {
                if (postUrls.length >= 5) return false; // 최대 5개만
                const href = $posts(elem).attr('href');
                if (href && !postUrls.includes(href)) {
                    const fullUrl = href.startsWith('http') ? href : `https://blog.naver.com${href}`;
                    postUrls.push(fullUrl);
                }
            });

            console.log(`[Crawl] Found ${postUrls.length} post URLs`);

            // 포스트 상세 정보는 수집하지 않음 (너무 불안정)
            // 대신 기본 정보만 저장
            recentPosts = postUrls.map((url, index) => ({
                title: `포스트 ${index + 1}`,
                url,
                date: new Date().toISOString(),
                likes: 0,
                comments: 0
            }));

        } catch (postError) {
            console.warn('[Crawl] Failed to fetch posts (non-critical):', postError);
            // 포스트 수집 실패는 무시
        }

        // 최소한의 유효성 검증 완화
        // 전체 방문자 수만 있어도 유효한 블로그로 간주
        if (visitorTotal === 0 && visitorToday === 0 && neighborCount === 0) {
            console.error('[Crawl] All statistics are zero - likely invalid blog or access denied');
            throw new Error('No valid statistics found - blog may be private or URL is incorrect');
        }

        console.log('[Crawl] ✅ Success! Returning statistics...');

        return {
            visitorToday,
            visitorTotal,
            neighborCount,
            recentPosts,
            mainCategories
        };

    } catch (error: any) {
        console.error('[Crawl] Error:', error.message);
        
        // 네트워크 에러인 경우 더 명확한 메시지
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw new Error('Blog crawling timeout - please try again later');
        }
        
        if (error.response?.status === 404) {
            throw new Error('Blog not found - please check the URL');
        }

        if (error.response?.status === 403) {
            throw new Error('Access denied - blog may be private');
        }

        throw new Error(`Crawling failed: ${error.message}`);
    }
}

/**
 * 블로그 URL에서 ID 추출
 */
function extractBlogId(url: string): string | null {
    // 패턴 1: blog.naver.com/blogId
    let match = url.match(/blog\.naver\.com\/([^\/\?]+)/);
    if (match) return match[1];

    // 패턴 2: m.blog.naver.com/blogId
    match = url.match(/m\.blog\.naver\.com\/([^\/\?]+)/);
    if (match) return match[1];

    return null;
}

/**
 * 숫자 추출 및 파싱
 */
function extractNumber(match: RegExpMatchArray | null): number {
    if (!match || !match[1]) return 0;
    const cleaned = match[1].replace(/,/g, '').replace(/\s/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
}

/**
 * 주요 카테고리 추출 (빈도수 기준)
 */
function extractMainCategories(posts: PostStats[]): string[] {
    const categoryCount: Record<string, number> = {};

    posts.forEach(post => {
        if (post.category) {
            categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
        }
    });

    // 빈도수 순으로 정렬하여 상위 3개 반환
    return Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);
}

/**
 * 영향력 점수 계산 (간소화 버전)
 * - 방문자 수 기반으로만 계산
 */
export function calculateInfluenceScore(stats: {
    visitorToday: number;
    visitorTotal: number;
    neighborCount: number;
    avgLikes?: number;
    avgComments?: number;
}): number {
    // 1. 일 방문자 점수 (0-40점) - 가중치 증가
    const dailyScore = Math.min(40, (stats.visitorToday / 100) * 40);

    // 2. 전체 방문자 점수 (0-40점) - 가중치 증가
    const totalScore = Math.min(40, (stats.visitorTotal / 100000) * 40);

    // 3. 이웃 수 점수 (0-20점)
    const neighborScore = Math.min(20, (stats.neighborCount / 500) * 20);

    // 좋아요/댓글은 선택적 (가져올 수 없는 경우가 많음)
    let engagementScore = 0;
    if (stats.avgLikes !== undefined && stats.avgComments !== undefined) {
        engagementScore = Math.min(10, ((stats.avgLikes + stats.avgComments) / 20) * 10);
    }

    // 총점 계산
    const totalInfluenceScore = dailyScore + totalScore + neighborScore + engagementScore;

    return Math.round(totalInfluenceScore);
}

/**
 * 평균 계산
 */
export function calculateAverages(posts: PostStats[]): {
    avgLikes: number;
    avgComments: number;
    avgEngagement: number;
} {
    if (posts.length === 0) {
        return { avgLikes: 0, avgComments: 0, avgEngagement: 0 };
    }

    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);

    const avgLikes = totalLikes / posts.length;
    const avgComments = totalComments / posts.length;
    const avgEngagement = (avgLikes + avgComments) / 2;

    return {
        avgLikes: Math.round(avgLikes * 100) / 100,
        avgComments: Math.round(avgComments * 100) / 100,
        avgEngagement: Math.round(avgEngagement * 100) / 100
    };
}
