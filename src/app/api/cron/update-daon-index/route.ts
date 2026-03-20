import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateDaonIndex } from '@/lib/services/daon-index';

// Timeout for the entire cron job to prevent Vercel execution limits
export const maxDuration = 60; // 60 seconds

export async function GET(request: Request) {
    try {
        // Authenticate the cron request (Vercel sets a specific header or use a secret)
        const authHeader = request.headers.get('Authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize Supabase admin client (to bypass RLS for background job)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for admin tasks
        
        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials missing for Cron Route.');
            return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 네이버 IP 차단을 고려하여, 한 번에 최대 처리할 인원 수 제한 (예: 2~3명)
        const BATCH_LIMIT = 2;
        
        // Fetch influencers who haven't been updated recently (e.g., older than 45 days) or NULL
        const fortyFiveDaysAgo = new Date();
        fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

        const { data: influencers, error } = await supabase
            .from('influencer_stats')
            .select('id, user_id, blog_url, daon_index_updated_at')
            .or(`daon_index_updated_at.is.null,daon_index_updated_at.lt.${fortyFiveDaysAgo.toISOString()}`)
            .not('blog_url', 'is', null) // blog_url이 존재하는 유저만
            .limit(BATCH_LIMIT);

        if (error) {
            console.error('Error fetching influencers for Daon index update:', error);
            return NextResponse.json({ error: 'Database fetch failed' }, { status: 500 });
        }

        if (!influencers || influencers.length === 0) {
            return NextResponse.json({ message: 'No influencers need Daon Index update at this time.' });
        }

        const results = [];

        for (const influencer of influencers) {
            if (!influencer.blog_url) continue;

            try {
                // 다온지수 핵심 로직 호출
                const score = await calculateDaonIndex(influencer.blog_url);

                // DB 업데이트
                const { error: updateError } = await supabase
                    .from('influencer_stats')
                    .update({
                        daon_index: score,
                        daon_index_updated_at: new Date().toISOString()
                    })
                    .eq('id', influencer.id);

                if (updateError) {
                    console.error(`Failed to update DB for ${influencer.user_id}:`, updateError);
                    results.push({ id: influencer.id, status: 'error', reason: updateError.message });
                } else {
                    results.push({ id: influencer.id, score, status: 'success' });
                }

                // 연속적인 요청에 의한 차단을 피하기 위한 딜레이
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (err) {
                console.error(`Error processing Daon Index for ${influencer.user_id}:`, err);
                results.push({ id: influencer.id, status: 'error' });
            }
        }

        return NextResponse.json({ 
            message: 'Daon Index batch processed successfully', 
            processed: results.length,
            details: results 
        });

    } catch (error) {
        console.error('Cron Daon Index error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
