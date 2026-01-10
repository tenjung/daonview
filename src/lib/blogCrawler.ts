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
 * 네이버 블로그 통계 크롤링
 */
export async function crawlNaverBlog(blogUrl: string): Promise<BlogStats> {
    try {
        const blogId = extractBlogId(blogUrl);
        if (!blogId) {
            throw new Error('Invalid blog URL');
        }

        console.log(`[Crawl] Starting for blog: ${blogId}`);

        // 1. 모바일 홈 페이지에서 기본 통계 수집
        const mobileHomeUrl = `https://m.blog.naver.com/${blogId}`;
        const homeResponse = await axios.get(mobileHomeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            },
            timeout: 10000
        });

        const $home = cheerio.load(homeResponse.data);

        // 방문자 수 추출 (모바일 헤더)
        const homeText = $home('body').text();
        const visitorToday = extractNumber(homeText.match(/오늘\s*(\d+[,\d]*)/)) ||
            extractNumber(homeText.match(/TODAY\s*(\d+[,\d]*)/i)) || 0;
        const visitorTotal = extractNumber(homeText.match(/전체\s*(\d+[,\d]*)/)) ||
            extractNumber(homeText.match(/TOTAL\s*(\d+[,\d]*)/i)) || 0;

        // 이웃 수 추출
        const neighborCount = extractNumber(homeText.match(/이웃\s*(\d+[,\d]*)/)) ||
            extractNumber(homeText.match(/BUDDY\s*(\d+[,\d]*)/i)) || 0;

        console.log(`[Crawl] Stats - Today: ${visitorToday}, Total: ${visitorTotal}, Neighbors: ${neighborCount}`);

        // 2. 블로그 탭에서 최근 포스팅 수집
        const blogTabUrl = `https://m.blog.naver.com/${blogId}?tab=1`;
        const blogResponse = await axios.get(blogTabUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            },
            timeout: 10000
        });

        const $blog = cheerio.load(blogResponse.data);

        // 포스팅 목록에서 URL 추출
        const postUrls: string[] = [];
        $blog('a[href*="/PostView.naver"]').each((i, elem) => {
            if (postUrls.length >= 10) return false;
            const href = $blog(elem).attr('href');
            if (href) {
                const fullUrl = href.startsWith('http') ? href : `https://m.blog.naver.com${href}`;
                if (!postUrls.includes(fullUrl)) {
                    postUrls.push(fullUrl);
                }
            }
        });

        console.log(`[Crawl] Found ${postUrls.length} posts`);

        // 3. 각 포스팅의 좋아요/댓글 수 수집 (병렬 처리, 최대 10개)
        const recentPosts = await Promise.all(
            postUrls.slice(0, 10).map(url => crawlPostDetails(url))
        );

        const validPosts = recentPosts.filter(p => p !== null) as PostStats[];
        console.log(`[Crawl] Successfully crawled ${validPosts.length} posts`);

        // 4. 주요 카테고리 추출
        const mainCategories = extractMainCategories(validPosts);

        return {
            visitorToday,
            visitorTotal,
            neighborCount,
            recentPosts: validPosts,
            mainCategories
        };
    } catch (error: any) {
        console.error('[Crawl] Error:', error.message);
        throw new Error(`Failed to crawl blog: ${error.message}`);
    }
}

/**
 * 블로그 URL에서 ID 추출
 */
function extractBlogId(url: string): string | null {
    const match = url.match(/blog\.naver\.com\/([^\/\?]+)/);
    return match ? match[1] : null;
}

/**
 * 숫자 추출 및 파싱
 */
function extractNumber(match: RegExpMatchArray | null): number {
    if (!match || !match[1]) return 0;
    return parseInt(match[1].replace(/,/g, ''));
}

/**
 * 방문자 수 추출
 */
function extractVisitorCount($: cheerio.CheerioAPI, type: 'TODAY' | 'TOTAL'): number {
    const text = $('body').text();
    const regex = new RegExp(`${type}\\s*(\\d+[,\\d]*)`, 'i');
    const match = text.match(regex);

    if (match && match[1]) {
        return parseInt(match[1].replace(/,/g, ''));
    }

    return 0;
}

/**
 * 이웃 수 추출
 */
function extractNeighborCount($: cheerio.CheerioAPI): number {
    // 이웃 수는 여러 패턴으로 표시될 수 있음
    const text = $('body').text();

    // 패턴 1: "이웃 326"
    let match = text.match(/이웃\s*(\d+[,\d]*)/);
    if (match && match[1]) {
        return parseInt(match[1].replace(/,/g, ''));
    }

    // 패턴 2: "BUDDY 326"
    match = text.match(/BUDDY\s*(\d+[,\d]*)/i);
    if (match && match[1]) {
        return parseInt(match[1].replace(/,/g, ''));
    }

    return 0;
}

/**
 * 최근 포스팅 크롤링
 */
async function crawlRecentPosts(blogId: string, count: number = 10): Promise<PostStats[]> {
    try {
        const posts: PostStats[] = [];

        // 모바일 포스트 목록 페이지
        const listUrl = `https://m.blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=0`;

        const response = await axios.get(listUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // 포스트 목록 추출
        $('.list_area .post_item, .list_area li').slice(0, count).each((i, elem) => {
            const $elem = $(elem);
            const $link = $elem.find('a').first();
            const title = $link.text().trim() || $elem.find('.tit').text().trim();
            const href = $link.attr('href');

            if (title && href) {
                const postUrl = href.startsWith('http') ? href : `https://m.blog.naver.com${href}`;
                const logNo = extractLogNo(postUrl);

                if (logNo) {
                    posts.push({
                        title,
                        url: postUrl,
                        date: new Date().toISOString(), // 실제로는 포스트 날짜 파싱 필요
                        likes: 0, // 개별 포스트 크롤링 필요
                        comments: 0,
                        category: undefined
                    });
                }
            }
        });

        // 각 포스트의 좋아요/댓글 수 크롤링 (병렬 처리)
        const detailedPosts = await Promise.all(
            posts.map(post => crawlPostDetails(post.url))
        );

        return detailedPosts.filter(p => p !== null) as PostStats[];
    } catch (error) {
        console.error('Error crawling recent posts:', error);
        return [];
    }
}

/**
 * 포스트 상세 정보 크롤링
 */
async function crawlPostDetails(postUrl: string): Promise<PostStats | null> {
    try {
        const response = await axios.get(postUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            },
            timeout: 5000
        });

        const $ = cheerio.load(response.data);
        const bodyText = $('body').text();

        // 제목 추출
        const title = $('meta[property="og:title"]').attr('content') ||
            $('title').text().split(':')[0].trim() ||
            '제목 없음';

        // 좋아요 수 (공감)
        let likes = 0;
        const likeMatch = bodyText.match(/공감\s*(\d+)/);
        if (likeMatch && likeMatch[1]) {
            likes = parseInt(likeMatch[1]);
        }

        // 댓글 수
        let comments = 0;
        const commentMatch = bodyText.match(/댓글\s*(\d+)/);
        if (commentMatch && commentMatch[1]) {
            comments = parseInt(commentMatch[1]);
        }

        // 카테고리 추출
        const category = $('meta[property="article:section"]').attr('content') ||
            $('.blog_category').text().trim() ||
            undefined;

        return {
            title,
            url: postUrl,
            date: new Date().toISOString(),
            likes,
            comments,
            category
        };
    } catch (error) {
        console.error(`[Crawl] Failed to crawl post ${postUrl}:`, error);
        return null;
    }
}

/**
 * URL에서 logNo 추출
 */
function extractLogNo(url: string): string | null {
    const match = url.match(/\/(\d+)$/);
    return match ? match[1] : null;
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
 * 영향력 점수 계산
 */
export function calculateInfluenceScore(stats: {
    visitorToday: number;
    visitorTotal: number;
    neighborCount: number;
    avgLikes: number;
    avgComments: number;
}): number {
    // 1. 일 방문자 점수 (0-25점)
    const dailyScore = Math.min(25, (stats.visitorToday / 100) * 25);

    // 2. 전체 방문자 점수 (0-25점)
    const totalScore = Math.min(25, (stats.visitorTotal / 100000) * 25);

    // 3. 이웃 수 점수 (0-25점)
    const neighborScore = Math.min(25, (stats.neighborCount / 500) * 25);

    // 4. 참여도 점수 (0-25점)
    const engagementScore = Math.min(25, ((stats.avgLikes + stats.avgComments) / 20) * 25);

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
