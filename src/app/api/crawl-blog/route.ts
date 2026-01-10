import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { crawlNaverBlog, calculateInfluenceScore, calculateAverages } from '@/lib/blogCrawler';

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

        console.log(`[Crawl] Starting for user ${userId}, blog: ${blogUrl}`);

        // 블로그 크롤링 실행
        let stats;
        try {
            stats = await crawlNaverBlog(blogUrl);
            console.log(`[Crawl] Success - Visitor today: ${stats.visitorToday}, Neighbors: ${stats.neighborCount}`);
        } catch (crawlError: any) {
            console.error('[Crawl] Failed:', crawlError.message);

            // 크롤링 실패를 DB에 기록
            await supabaseAdmin
                .from('influencer_stats')
                .upsert({
                    user_id: userId,
                    platform: 'NAVER_BLOG',
                    blog_url: blogUrl,
                    crawl_status: 'FAILED',
                    crawl_error: crawlError.message || 'Crawling failed',
                    last_crawled_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,platform'
                });

            return NextResponse.json(
                {
                    error: 'Failed to crawl blog',
                    details: crawlError.message
                },
                { status: 500 }
            );
        }

        // 평균 계산
        const averages = calculateAverages(stats.recentPosts);

        // 영향력 점수 계산
        const influenceScore = calculateInfluenceScore({
            visitorToday: stats.visitorToday,
            visitorTotal: stats.visitorTotal,
            neighborCount: stats.neighborCount,
            avgLikes: averages.avgLikes,
            avgComments: averages.avgComments
        });

        // DB에 저장 (UPSERT)
        const { data, error } = await supabaseAdmin
            .from('influencer_stats')
            .upsert({
                user_id: userId,
                platform: 'NAVER_BLOG',
                blog_url: blogUrl,
                visitor_today: stats.visitorToday,
                visitor_total: stats.visitorTotal,
                neighbor_count: stats.neighborCount,
                avg_likes: averages.avgLikes,
                avg_comments: averages.avgComments,
                avg_engagement: averages.avgEngagement,
                main_categories: stats.mainCategories,
                recent_posts: stats.recentPosts,
                influence_score: influenceScore,
                last_crawled_at: new Date().toISOString(),
                crawl_status: 'SUCCESS',
                crawl_error: null
            }, {
                onConflict: 'user_id,platform'
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);

            // 크롤링은 성공했지만 DB 저장 실패 시 에러 기록
            await supabaseAdmin
                .from('influencer_stats')
                .upsert({
                    user_id: userId,
                    platform: 'NAVER_BLOG',
                    blog_url: blogUrl,
                    crawl_status: 'FAILED',
                    crawl_error: error.message,
                    last_crawled_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,platform'
                });

            throw error;
        }

        console.log(`Crawl successful for user ${userId}:`, {
            visitorToday: stats.visitorToday,
            neighborCount: stats.neighborCount,
            influenceScore
        });

        return NextResponse.json({
            success: true,
            data: {
                ...data,
                stats: {
                    visitorToday: stats.visitorToday,
                    visitorTotal: stats.visitorTotal,
                    neighborCount: stats.neighborCount,
                    avgLikes: averages.avgLikes,
                    avgComments: averages.avgComments,
                    influenceScore
                }
            }
        });
    } catch (error: any) {
        console.error('Crawl error:', error);

        const supabaseAdmin = getSupabaseAdmin();

        // 에러 발생 시 DB에 기록
        const { userId, blogUrl } = await request.json().catch(() => ({}));
        if (userId && blogUrl) {
            await supabaseAdmin
                .from('influencer_stats')
                .upsert({
                    user_id: userId,
                    platform: 'NAVER_BLOG',
                    blog_url: blogUrl,
                    crawl_status: 'FAILED',
                    crawl_error: error.message || 'Unknown error',
                    last_crawled_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,platform'
                });
        }

        return NextResponse.json(
            {
                error: 'Failed to crawl blog',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// GET: 통계 조회
export async function GET(request: NextRequest) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('influencer_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('platform', 'NAVER_BLOG')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // 데이터 없음
                return NextResponse.json({ data: null });
            }
            throw error;
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats', details: error.message },
            { status: 500 }
        );
    }
}
