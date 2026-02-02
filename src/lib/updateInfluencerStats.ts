import { supabase } from './supabaseClient';

/**
 * 인플루언서 통계 업데이트 함수
 * - 하루 1회 제한
 * - 블로그 크롤링 후 통계 갱신
 */
export async function updateInfluencerStats(userId: string): Promise<boolean> {
    try {
        // 1. 사용자 프로필 가져오기
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('sns_url, last_stats_updated_at, role')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            console.error('Profile not found:', profileError);
            return false;
        }

        // 인플루언서가 아니면 스킵
        if (profile.role !== 'INFLUENCER') {
            return false;
        }

        // SNS URL이 없으면 스킵
        if (!profile.sns_url) {
            console.log('No SNS URL found for user:', userId);
            return false;
        }

        // 2. 마지막 업데이트 시간 확인 (24시간 제한)
        if (profile.last_stats_updated_at) {
            const lastUpdated = new Date(profile.last_stats_updated_at);
            const now = new Date();
            const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

            if (hoursSinceUpdate < 24) {
                console.log(`Stats updated ${hoursSinceUpdate.toFixed(1)} hours ago. Skipping.`);
                return false;
            }
        }

        // 3. 블로그 크롤링 실행
        console.log('Crawling blog for user:', userId);
        const crawlResponse = await fetch('/api/crawl-blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: userId,
                blogUrl: profile.sns_url 
            })
        });

        if (!crawlResponse.ok) {
            console.error('Crawl failed:', await crawlResponse.text());
            return false;
        }

        const crawlData = await crawlResponse.json();

        if (!crawlData.success || !crawlData.data) {
            console.error('No crawl data returned');
            return false;
        }

        // 4. 통계 업데이트
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                blog_visitor_count: crawlData.data.visitorCount || 0,
                blog_post_count: crawlData.data.postCount || 0,
                blog_subscriber_count: crawlData.data.subscriberCount || 0,
                last_stats_updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Failed to update stats:', updateError);
            return false;
        }

        console.log('Stats updated successfully for user:', userId);
        return true;
    } catch (error) {
        console.error('Error in updateInfluencerStats:', error);
        return false;
    }
}
