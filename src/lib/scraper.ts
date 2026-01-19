import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function scrapeNaverBlog(url: string) {
    // URL에서 블로그 ID와 포스트 ID 추출
    const match = url.match(/blog\.naver\.com\/([^\/]+)\/(\d+)/);
    if (!match) {
        throw new Error('Invalid Naver Blog URL');
    }

    const blogId = match[1];
    const postId = match[2];

    let title = '';
    let description = '';
    let thumbnail = '';
    let authorName = '';

    // 1. 네이버 공식 검색 API 연동 시도
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (clientId && clientSecret) {
        try {
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
                    title = item.title.replace(/<[^>]*>?/gm, '');
                    description = item.description.replace(/<[^>]*>?/gm, '');
                    authorName = item.bloggername;
                }
            }
        } catch (e) {
            console.error('Naver Search API Error:', e);
        }
    }

    // 2. 모바일 페이지 크롤링
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

            thumbnail = $('meta[property="og:image"]').attr('content') || '';
            
            if (!title) title = $('meta[property="og:title"]').attr('content') || '';
            if (!description) description = $('meta[property="og:description"]').attr('content') || '';
            
            if (!authorName) {
                authorName = $('meta[property="naverblog:nickname"]').attr('content') || 
                             $('meta[name="author"]').attr('content') || 
                             $('.blog_author .nick').text().trim() || 
                             $('.se_og_box .name').text().trim() || '';
            }

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

    return {
        title: title || '제목 없음',
        description: description,
        thumbnail: thumbnail,
        authorName: authorName || blogId,
        blogId,
        postId,
        url
    };
}

export async function scrapeInstagram(url: string) {
    try {
        const match = url.match(/instagram\.com\/p\/([^\/\?]+)/);
        const postId = match ? match[1] : '';

        const accessToken = `${process.env.META_APP_ID}|${process.env.META_CLIENT_TOKEN}`;
        const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;

        const response = await fetch(oembedUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            const authorName = data.author_name || 'Instagram User';
            const title = data.title || '인스타그램 포스트';
            const thumbnailUrl = data.thumbnail_url || '';
            
            let description = '';
            if (data.html) {
                const captionMatch = data.html.match(/caption["\s:]+([^"<]+)/i);
                if (captionMatch) description = captionMatch[1].trim();
            }

            return {
                title: title,
                description: description,
                thumbnail: thumbnailUrl,
                authorName: authorName,
                postId,
                url
            };
        }
    } catch (error) {
        console.error('Instagram oEmbed error:', error);
    }

    // Fallback
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
                if (titleMatch) authorName = titleMatch[1].trim();
            }

            return {
                title: ogTitle || '인스타그램 포스트',
                description: ogDescription,
                thumbnail: ogImage,
                authorName: authorName || 'Instagram User',
                url
            };
        }
    } catch (fallbackError) {
        console.error('Instagram fallback error:', fallbackError);
    }

    return {
        title: '인스타그램 포스트',
        description: '',
        thumbnail: '',
        authorName: 'Instagram User',
        url
    };
}
