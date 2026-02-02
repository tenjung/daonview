import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

/**
 * POST /api/crawl-blog
 * 블로그 통계 기능 비활성화됨
 * 
 * 이 엔드포인트는 더 이상 블로그 분석을 수행하지 않습니다.
 * 기본 정보만 저장합니다.
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await request.json();
        const { userId, blogUrl } = body;

        if (!userId || !blogUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: userId and blogUrl' },
                { status: 400 }
            );
        }

        console.log(`[CrawlAPI] Saving basic info for user ${userId}, blog: ${blogUrl}`);

        // DB에 기본 정보만 저장 (분석 없이)
        const { data, error } = await supabaseAdmin
            .from('influencer_stats')
            .upsert({
                user_id: userId,
                platform: 'NAVER_BLOG',
                blog_url: blogUrl,
                
                // 기본값 설정
                visitor_today: 0,
                visitor_yesterday: 0,
                visitor_total: 0,
                neighbor_count: 0,
                avg_likes: 0,
                avg_comments: 0,
                avg_engagement: 0,
                main_categories: [],
                influence_score: 0,
                
                // 메타 정보
                crawl_status: 'DISABLED',
                crawl_error: 'Blog analysis feature has been disabled',
                last_crawled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,platform'
            });

        if (error) {
            console.error('[CrawlAPI] DB save error:', error);
            return NextResponse.json(
                { error: 'Failed to save info', details: error.message },
                { status: 500 }
            );
        }

        console.log(`[CrawlAPI] ✅ Basic info saved`);

        // 성공 응답
        return NextResponse.json({
            success: true,
            message: 'Blog analysis feature is disabled. Basic info saved.',
            data: {
                userId,
                blogUrl,
                status: 'DISABLED'
            }
        });

    } catch (error: any) {
        console.error('[CrawlAPI] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
