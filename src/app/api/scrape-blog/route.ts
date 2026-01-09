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

    // 모바일 페이지에서 정보 가져오기
    const mobileUrl = `https://m.blog.naver.com/${blogId}/${postId}`;
    
    const response = await fetch(mobileUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch blog page');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Open Graph 메타데이터 추출
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    
    // 닉네임 추출 (여러 방법 시도)
    let blogName = '';
    
    blogName = $('meta[property="naverblog:nickname"]').attr('content') || '';
    
    if (!blogName) {
        blogName = $('meta[name="author"]').attr('content') || '';
    }
    
    if (!blogName) {
        blogName = $('.blog_author .nick').text().trim() || '';
    }
    
    if (!blogName) {
        blogName = $('.se_og_box .name').text().trim() || '';
    }

    // 블로그 홈에서 닉네임 가져오기
    if (!blogName) {
        try {
            const blogHomeUrl = `https://m.blog.naver.com/${blogId}`;
            const homeResponse = await fetch(blogHomeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                }
            });
            
            if (homeResponse.ok) {
                const homeHtml = await homeResponse.text();
                const $home = cheerio.load(homeHtml);
                blogName = $home('.blog_title').text().trim() || 
                          $home('.nick_name').text().trim() || 
                          $home('.user_name').text().trim() || '';
            }
        } catch (e) {
            console.log('Failed to fetch blog home:', e);
        }
    }

    if (!blogName) {
        blogName = blogId;
    }

    return NextResponse.json({
        success: true,
        data: {
            title: ogTitle,
            description: ogDescription,
            thumbnail: ogImage,
            authorName: blogName,
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
