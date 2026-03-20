// 테스트용 신청자 데이터 생성 스크립트
// 사용법: 브라우저 콘솔에서 실행하거나, Node.js 환경에서 실행
import { supabase } from '../src/lib/supabase/client.ts';

console.log('🌱 Starting to seed applications...');

async function seedApplications() {
    console.log('🌱 Starting to seed applications...');

    try {
        // 1. 인플루언서 사용자 조회
        const { data: influencers, error: influencersError } = await supabase
            .from('profiles')
            .select('id, nickname, email')
            .eq('role', 'INFLUENCER')
            .limit(10);

        if (influencersError) {
            console.error('❌ Error fetching influencers:', influencersError);
            return;
        }

        if (!influencers || influencers.length === 0) {
            console.log('⚠️ No influencers found. Please create influencer accounts first.');
            return;
        }

        console.log(`✅ Found ${influencers.length} influencers`);

        // 2. 진행 중인 캠페인 조회
        const { data: campaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('id, title')
            .in('status', ['RECRUITING', 'ONGOING'])
            .limit(3);

        if (campaignsError) {
            console.error('❌ Error fetching campaigns:', campaignsError);
            return;
        }

        if (!campaigns || campaigns.length === 0) {
            console.log('⚠️ No active campaigns found.');
            return;
        }

        console.log(`✅ Found ${campaigns.length} active campaigns`);

        // 3. 각 캠페인에 신청자 추가
        const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
        const messages = [
            '안녕하세요! 이 캠페인에 참여하고 싶습니다. 제 SNS를 통해 좋은 리뷰를 작성하겠습니다.',
            '평소 이런 제품에 관심이 많았습니다. 성실하게 리뷰하겠습니다!',
            '팔로워 수는 많지 않지만 진정성 있는 콘텐츠로 승부하겠습니다.',
            '이전에도 여러 캠페인에 참여한 경험이 있습니다. 믿고 맡겨주세요!',
            '제 블로그/인스타그램을 통해 많은 분들께 알려드리겠습니다.',
        ];

        let totalInserted = 0;

        for (const campaign of campaigns) {
            console.log(`\n📢 Processing campaign: ${campaign.title}`);

            // 각 캠페인에 3-5명의 신청자 추가
            const applicantCount = Math.floor(Math.random() * 3) + 3; // 3-5명
            const selectedInfluencers = influencers.slice(0, applicantCount);

            for (let i = 0; i < selectedInfluencers.length; i++) {
                const influencer = selectedInfluencers[i];
                const status = statuses[i % statuses.length];
                const message = messages[i % messages.length];

                // 중복 체크
                const { data: existing } = await supabase
                    .from('applications')
                    .select('id')
                    .eq('campaign_id', campaign.id)
                    .eq('user_id', influencer.id)
                    .single();

                if (existing) {
                    console.log(`  ⏭️  ${influencer.nickname} already applied to this campaign`);
                    continue;
                }

                // 신청 추가
                const { error: insertError } = await supabase
                    .from('applications')
                    .insert({
                        campaign_id: campaign.id,
                        user_id: influencer.id,
                        status: status,
                        message: message,
                        created_at: new Date(Date.now() - i * 3600000).toISOString(), // 시간차를 두고 생성
                    });

                if (insertError) {
                    console.error(`  ❌ Error inserting application for ${influencer.nickname}:`, insertError);
                } else {
                    console.log(`  ✅ ${influencer.nickname} (${influencer.email}) - ${status}`);
                    totalInserted++;
                }
            }
        }

        console.log(`\n🎉 Successfully seeded ${totalInserted} applications!`);

        // 4. 결과 확인
        console.log('\n📊 Application Statistics:');
        for (const campaign of campaigns) {
            const { data: apps } = await supabase
                .from('applications')
                .select('status')
                .eq('campaign_id', campaign.id);

            if (apps) {
                const stats = {
                    total: apps.length,
                    pending: apps.filter(a => a.status === 'PENDING').length,
                    approved: apps.filter(a => a.status === 'APPROVED').length,
                    rejected: apps.filter(a => a.status === 'REJECTED').length,
                };

                console.log(`\n  ${campaign.title}:`);
                console.log(`    - Total: ${stats.total}`);
                console.log(`    - Pending: ${stats.pending}`);
                console.log(`    - Approved: ${stats.approved}`);
                console.log(`    - Rejected: ${stats.rejected}`);
            }
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

seedApplications();
