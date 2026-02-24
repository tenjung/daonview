import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeNaverBlog, scrapeInstagram } from '@/lib/scraper';

// ✅ Node.js Runtime 강제 설정 (Cheerio 사용을 위해 필수)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const url_base = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url_base || !key) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabaseAdmin = createClient(url_base, key, {
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
                const normalizedUrl = String(url).toLowerCase();

                // 플랫폼 구분
                const platform = normalizedUrl.includes('blog.naver.com') ? 'BLOG' :
                    normalizedUrl.includes('instagram.com') ? 'INSTAGRAM' :
                        normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be') ? 'YOUTUBE' :
                            normalizedUrl.includes('tiktok.com') ? 'TIKTOK' : 'OTHER';

                // 메타데이터 수집 (직접 함수 호출로 변경하여 내부 fetch 오류 방지)
                let metadata = null;
                if (platform.toUpperCase() === 'BLOG') {
                    metadata = await scrapeNaverBlog(url);
                } else if (platform.toUpperCase() === 'INSTAGRAM') {
                    metadata = await scrapeInstagram(url);
                }

                // DB에 삽입 (필드명 수정: review_url -> post_url)
                const { data, error } = await supabaseAdmin
                    .from('reviews')
                    .insert({
                        user_id: userId,
                        post_url: url,
                        post_id: metadata?.postId || null,
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
                console.error(`Error processing URL ${url}:`, error);
                results.push({
                    url,
                    success: false,
                    error: error.message
                });
            }

            // Rate limiting (300ms 대기)
            await new Promise(resolve => setTimeout(resolve, 300));
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
