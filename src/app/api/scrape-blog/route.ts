import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 플랫폼 구분
        const isNaverBlog = url.includes('blog.naver.com');
        const isInstagram = url.includes('instagram.com');

        if (!isNaverBlog && !isInstagram) {
            return NextResponse.json({ 
                error: 'Only Naver Blog and Instagram URLs are supported' 
            }, { status: 400 });
        }

        // === 네이버 블로그 크롤링 ===
        if (isNaverBlog) {
            return await scrapeNaverBlog(url);
        }

        // === 인스타그램 크롤링 ===
        if (isInstagram) {
            return await scrapeInstagram(url);
        }

    } catch (error: any) {
        console.error('Error scraping:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to scrape data' },
            { status: 500 }
        );
    }
}

// 네이버 블로그 크롤링 함수
async function scrapeNaverBlog(url: string) {
    // URL에서 블로그 ID와 포스트 ID 추출
    const match = url.match(/blog\.naver\.com\/([^\/]+)\/(\d+)/);
    if (!match) {
        return NextResponse.json({ error: 'Invalid Naver Blog URL' }, { status: 400 });
    }

    const blogId = match[1];
    const postId = match[2];

    let title = '';
    let description = '';
    let thumbnail = '';
    let authorName = '';

    // 1. 네이버 공식 검색 API 연동 시도 (제목, 작성자명 등 안정적 수집)
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (clientId && clientSecret) {
        try {
            // URL을 쿼리로 사용하여 해당 게시글 검색
            const searchRes = await fetch(
                `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(url)}&display=1`,
                {
                    headers: {
                        'X-Naver-Client-Id': clientId,
                        'X-Naver-Client-Secret': clientSecret,
                    }
                }
            );

            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.items && searchData.items.length > 0) {
                    const item = searchData.items[0];
                    // HTML 태그 제거
                    title = item.title.replace(/<[^>]*>?/gm, '');
                    description = item.description.replace(/<[^>]*>?/gm, '');
                    authorName = item.bloggername;
                }
            }
        } catch (e) {
            console.error('Naver Search API Error:', e);
        }
    }

    // 2. 모바일 페이지 크롤링 (공식 API가 주지 않는 썸네일 수집 및 Fallback)
    try {
        const mobileUrl = `https://m.blog.naver.com/${blogId}/${postId}`;
        const response = await fetch(mobileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        });

        if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);

            // 썸네일은 항상 크롤링으로 가져와야 함 (공식 API 미지원)
            thumbnail = $('meta[property="og:image"]').attr('content') || '';
            
            // API 결과가 없을 때만 크롤링 데이터 사용
            if (!title) title = $('meta[property="og:title"]').attr('content') || '';
            if (!description) description = $('meta[property="og:description"]').attr('content') || '';
            
            if (!authorName) {
                authorName = $('meta[property="naverblog:nickname"]').attr('content') || 
                             $('meta[name="author"]').attr('content') || 
                             $('.blog_author .nick').text().trim() || 
                             $('.se_og_box .name').text().trim() || '';
            }

            // 블로그 홈에서 닉네임 추가 확인
            if (!authorName) {
                const blogHomeUrl = `https://m.blog.naver.com/${blogId}`;
                const homeResponse = await fetch(blogHomeUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15' }
                });
                if (homeResponse.ok) {
                    const homeHtml = await homeResponse.text();
                    const $home = cheerio.load(homeHtml);
                    authorName = $home('.blog_title').text().trim() || 
                               $home('.nick_name').text().trim() || 
                               $home('.user_name').text().trim() || '';
                }
            }
        }
    } catch (e) {
        console.error('Cheerio Scraping Error:', e);
    }

    return NextResponse.json({
        success: true,
        data: {
            title: title || '제목 없음',
            description: description,
            thumbnail: thumbnail,
            authorName: authorName || blogId,
            blogId,
            postId,
            url
        }
    });
}

// 인스타그램 크롤링 함수 (Meta oEmbed API 사용)
async function scrapeInstagram(url: string) {
    try {
        // 인스타그램 포스트 ID 추출
        const match = url.match(/instagram\.com\/p\/([^\/\?]+)/);
        const postId = match ? match[1] : '';

        // Meta oEmbed API 사용
        const accessToken = `${process.env.META_APP_ID}|${process.env.META_CLIENT_TOKEN}`;
        const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;

        console.log('Instagram oEmbed API URL:', oembedUrl);

        const response = await fetch(oembedUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Instagram oEmbed API error:', response.status, errorText);
            throw new Error(`oEmbed API failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Instagram oEmbed response:', data);

        // oEmbed 응답 구조:
        // {
        //   "author_name": "작성자명",
        //   "author_url": "https://www.instagram.com/username",
        //   "title": "작성자명",
        //   "thumbnail_url": "https://...",
        //   "thumbnail_width": 640,
        //   "thumbnail_height": 640,
        //   "html": "..."
        // }

        const authorName = data.author_name || 'Instagram User';
        const title = data.title || '인스타그램 포스트';
        const thumbnailUrl = data.thumbnail_url || '';
        
        // HTML에서 캡션 추출 시도
        let description = '';
        if (data.html) {
            const captionMatch = data.html.match(/caption["\s:]+([^"<]+)/i);
            if (captionMatch) {
                description = captionMatch[1].trim();
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                title: title,
                description: description,
                thumbnail: thumbnailUrl,
                authorName: authorName,
                postId,
                url
            }
        });

    } catch (error: any) {
        console.error('Instagram oEmbed error:', error);
        
        // oEmbed 실패 시 기본 HTML 스크래핑으로 폴백
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });

            if (response.ok) {
                const html = await response.text();
                const $ = cheerio.load(html);

                const ogTitle = $('meta[property="og:title"]').attr('content') || '';
                const ogDescription = $('meta[property="og:description"]').attr('content') || '';
                const ogImage = $('meta[property="og:image"]').attr('content') || '';
                
                let authorName = '';
                if (ogTitle) {
                    const titleMatch = ogTitle.match(/^([^:]+)/);
                    if (titleMatch) {
                        authorName = titleMatch[1].trim();
                    }
                }

                return NextResponse.json({
                    success: true,
                    data: {
                        title: ogTitle || '인스타그램 포스트',
                        description: ogDescription,
                        thumbnail: ogImage,
                        authorName: authorName || 'Instagram User',
                        url
                    }
                });
            }
        } catch (fallbackError) {
            console.error('Instagram fallback scraping error:', fallbackError);
        }

        // 모든 방법 실패 시 기본값 반환
        return NextResponse.json({
            success: true,
            data: {
                title: '인스타그램 포스트',
                description: '',
                thumbnail: '',
                authorName: 'Instagram User',
                url
            }
        });
    }
}
