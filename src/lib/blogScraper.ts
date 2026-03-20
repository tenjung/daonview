import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * 블로그 포스트 정보
 */
export interface BlogPost {
    title: string;
    url: string;
    logNo: string;
    date?: string;
}

/**
 * 스크래핑된 포스트 콘텐츠
 */
export interface ScrapedContent {
    title: string;
    url: string;
    textContent: string;      // 순수 텍스트 (HTML 태그 제거)
    textLength: number;       // 글자 수
    wordCount: number;        // 단어 수
    imageCount: number;       // 이미지 개수
    imageUrls: string[];      // 이미지 URL 목록
}

/**
 * 네이버 블로그에서 최신 포스트 목록 가져오기
 * @param blogUrl 블로그 URL (예: https://blog.naver.com/blogId)
 * @param limit 가져올 포스트 개수 (기본: 2)
 */
export async function getRecentPosts(blogUrl: string, limit: number = 2): Promise<BlogPost[]> {
    try {
        const blogId = extractBlogId(blogUrl);
        if (!blogId) {
            throw new Error('Invalid blog URL');
        }

        console.log(`[Scraper] Fetching recent posts for blog: ${blogId}`);

        // 방법 1: 블로그 메인 페이지에서 포스트 추출
        const mainUrl = `https://blog.naver.com/${blogId}`;
        
        const response = await axios.get(mainUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.naver.com/'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const posts: BlogPost[] = [];
        const seenLogNos = new Set<string>();

        // 여러 패턴으로 포스트 링크 찾기
        const selectors = [
            'a[href*="PostView"]',
            'a[href*="/PostView.naver"]',
            'a[href*="/PostView.nhn"]',
            'a[href*="logNo="]',
            'iframe[src*="PostList"]'
        ];

        // iframe에서 포스트 목록 URL 찾기
        $('iframe').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src && src.includes('PostList')) {
                console.log(`[Scraper] Found PostList iframe: ${src}`);
            }
        });

        // 모든 링크에서 logNo 추출
        $('a').each((i, elem) => {
            if (posts.length >= limit) return false;

            const href = $(elem).attr('href');
            if (!href) return;

            // logNo 추출 (여러 패턴 지원)
            let logNoMatch = href.match(/logNo=(\d+)/);
            if (!logNoMatch) {
                logNoMatch = href.match(/\/(\d{10,})$/); // URL 끝에 숫자만 있는 경우
            }
            
            if (!logNoMatch) return;

            const logNo = logNoMatch[1];
            
            // 중복 체크
            if (seenLogNos.has(logNo)) return;
            seenLogNos.add(logNo);

            const title = $(elem).text().trim() || $(elem).attr('title') || `포스트 ${posts.length + 1}`;
            const fullUrl = `https://blog.naver.com/${blogId}/${logNo}`;

            posts.push({
                title: title.substring(0, 100), // 제목 길이 제한
                url: fullUrl,
                logNo
            });

            console.log(`[Scraper] Found post: ${logNo} - ${title.substring(0, 30)}...`);
        });

        // 포스트를 찾지 못한 경우, RSS 피드 시도
        if (posts.length === 0) {
            console.log(`[Scraper] No posts found in main page, trying RSS feed...`);
            const rssPosts = await getPostsFromRSS(blogId, limit);
            posts.push(...rssPosts);
        }

        console.log(`[Scraper] Found ${posts.length} posts`);
        
        if (posts.length === 0) {
            throw new Error('No posts found - blog may be empty, private, or structure changed');
        }

        return posts.slice(0, limit);

    } catch (error: any) {
        console.error('[Scraper] Failed to get recent posts:', error.message);
        throw new Error(`Failed to fetch blog posts: ${error.message}`);
    }
}

/**
 * RSS 피드에서 포스트 가져오기 (대안 방법)
 */
async function getPostsFromRSS(blogId: string, limit: number): Promise<BlogPost[]> {
    try {
        const rssUrl = `https://rss.blog.naver.com/${blogId}.xml`;
        const response = await axios.get(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data, { xmlMode: true });
        const posts: BlogPost[] = [];

        $('item').each((i, elem) => {
            if (posts.length >= limit) return false;

            const link = $(elem).find('link').text();
            const title = $(elem).find('title').text();
            
            const logNoMatch = link.match(/\/(\d+)$/);
            if (!logNoMatch) return;

            posts.push({
                title,
                url: link,
                logNo: logNoMatch[1]
            });
        });

        console.log(`[Scraper] Found ${posts.length} posts from RSS`);
        return posts;

    } catch (error) {
        console.log(`[Scraper] RSS feed failed, returning empty`);
        return [];
    }
}

/**
 * 네이버 블로그 포스트 본문 스크래핑
 * @param postUrl 포스트 URL
 */
export async function scrapePostContent(postUrl: string): Promise<ScrapedContent> {
    try {
        console.log(`[Scraper] Scraping post: ${postUrl}`);

        const response = await axios.get(postUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);

        // 제목 추출
        const title = $('meta[property="og:title"]').attr('content') || 
                     $('.se-title-text').text().trim() ||
                     $('h3.se_textarea').text().trim() ||
                     '제목 없음';

        // 본문 컨테이너 찾기 (여러 버전 대응)
        let contentContainer = $('.se-main-container');  // 스마트에디터 3.0
        if (contentContainer.length === 0) {
            contentContainer = $('#postViewArea');        // 레거시
        }
        if (contentContainer.length === 0) {
            contentContainer = $('.post-view');           // 구버전
        }

        // 광고, 버튼 등 불필요한 요소 제거
        contentContainer.find('.se-component-content[data-type="ad"]').remove();
        contentContainer.find('.btn_area').remove();
        contentContainer.find('.post_info').remove();
        contentContainer.find('script').remove();
        contentContainer.find('style').remove();

        // 이미지 추출
        const imageUrls: string[] = [];
        contentContainer.find('img').each((i, elem) => {
            const src = $(elem).attr('src') || 
                       $(elem).attr('data-lazy-src') || 
                       $(elem).attr('data-src');
            if (src && !src.includes('emoticon')) {  // 이모티콘 제외
                imageUrls.push(src);
            }
        });

        // 순수 텍스트 추출
        const textContent = contentContainer.text()
            .replace(/\s+/g, ' ')  // 연속된 공백을 하나로
            .trim();

        // 글자 수 계산 (공백 제외)
        const textLength = textContent.replace(/\s/g, '').length;

        // 단어 수 계산 (공백 기준)
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

        console.log(`[Scraper] ✅ Scraped - Text: ${textLength} chars, Images: ${imageUrls.length}`);

        return {
            title,
            url: postUrl,
            textContent,
            textLength,
            wordCount,
            imageCount: imageUrls.length,
            imageUrls
        };

    } catch (error: any) {
        console.error('[Scraper] Failed to scrape post:', error.message);
        throw new Error(`Failed to scrape post content: ${error.message}`);
    }
}

/**
 * 블로그 URL에서 블로그 ID 추출
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
 * 여러 포스트를 병렬로 스크래핑
 * @param posts 포스트 목록
 * @param delayMs 각 요청 사이 대기 시간 (ms)
 */
export async function scrapeMultiplePosts(
    posts: BlogPost[], 
    delayMs: number = 1000
): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];

    for (const post of posts) {
        try {
            const content = await scrapePostContent(post.url);
            results.push(content);

            // 네이버 서버 부하 방지를 위한 대기
            if (posts.indexOf(post) < posts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        } catch (error) {
            console.warn(`[Scraper] Failed to scrape post ${post.url}, skipping...`);
            // 실패한 포스트는 건너뛰고 계속 진행
        }
    }

    return results;
}
