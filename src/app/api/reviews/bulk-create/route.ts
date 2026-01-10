import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabaseAdmin = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        const { urls, userId } = await request.json();

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const results = [];

        for (const url of urls) {
            try {
                // 플랫폼 구분
                const platform = url.includes('blog.naver.com') ? 'NAVER_BLOG' :
                    url.includes('instagram.com') ? 'INSTAGRAM' :
                        url.includes('youtube.com') || url.includes('youtu.be') ? 'YOUTUBE' :
                            url.includes('tiktok.com') ? 'TIKTOK' : 'OTHER';

                // 메타데이터 크롤링
                let metadata = null;
                if (platform === 'NAVER_BLOG' || platform === 'INSTAGRAM') {
                    const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/scrape-blog`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url })
                    });

                    if (scrapeResponse.ok) {
                        const scrapeResult = await scrapeResponse.json();
                        if (scrapeResult.success) {
                            metadata = scrapeResult.data;
                        }
                    }
                }

                // DB에 삽입
                const { data, error } = await supabaseAdmin
                    .from('reviews')
                    .insert({
                        user_id: userId,
                        review_url: url,
                        platform,
                        title: metadata?.title || null,
                        description: metadata?.description || null,
                        thumbnail_url: metadata?.thumbnail || null,
                        author_name: metadata?.authorName || null,
                        status: 'APPROVED'
                    })
                    .select()
                    .single();

                if (error) {
                    results.push({
                        url,
                        success: false,
                        error: error.message
                    });
                } else {
                    results.push({
                        url,
                        success: true,
                        data: {
                            id: data.id,
                            title: data.title,
                            author_name: data.author_name
                        }
                    });
                }

            } catch (error: any) {
                results.push({
                    url,
                    success: false,
                    error: error.message
                });
            }

            // Rate limiting (500ms 대기)
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            summary: {
                total: urls.length,
                success: successCount,
                failed: failCount
            },
            results
        });

    } catch (error: any) {
        console.error('Bulk create error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create reviews' },
            { status: 500 }
        );
    }
}
