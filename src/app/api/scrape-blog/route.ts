import { NextRequest, NextResponse } from 'next/server';
import { scrapeNaverBlog, scrapeInstagram } from '@/lib/scraper';

// ✅ Node.js Runtime 강제 설정 (Cheerio 사용을 위해 필수)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const isNaverBlog = url.includes('blog.naver.com');
        const isInstagram = url.includes('instagram.com');

        if (!isNaverBlog && !isInstagram) {
            return NextResponse.json({
                error: 'Only Naver Blog and Instagram URLs are supported'
            }, { status: 400 });
        }

        let result;
        if (isNaverBlog) {
            result = await scrapeNaverBlog(url);
        } else {
            result = await scrapeInstagram(url);
        }

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Error scraping:', error);

        if (error.message === 'POST_NOT_FOUND') {
            return NextResponse.json(
                { error: 'Post not found or deleted' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to scrape data' },
            { status: 500 }
        );
    }
}
