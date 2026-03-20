/**
 * 블로그 크롤러 테스트 스크립트
 * 
 * 사용법:
 * node --loader ts-node/esm test-crawler.mjs
 */

import { crawlNaverBlog, calculateInfluenceScore } from './src/lib/blogCrawler.ts';

async function testCrawler() {
    console.log('🔍 블로그 크롤러 테스트 시작...\n');

    // 테스트할 블로그 URL (실제 존재하는 블로그)
    const testUrls = [
        'https://blog.naver.com/doriclan', // 사용자의 블로그
        'https://blog.naver.com/prologue/PrologueList.naver?blogId=doriclan', // 다른 형식
    ];

    for (const url of testUrls) {
        console.log(`\n📝 테스트 URL: ${url}`);
        console.log('─'.repeat(50));

        try {
            const stats = await crawlNaverBlog(url);
            
            console.log('✅ 크롤링 성공!');
            console.log(`   - 오늘 방문자: ${stats.visitorToday.toLocaleString()}명`);
            console.log(`   - 전체 방문자: ${stats.visitorTotal.toLocaleString()}명`);
            console.log(`   - 이웃 수: ${stats.neighborCount.toLocaleString()}명`);
            console.log(`   - 최근 포스트: ${stats.recentPosts.length}개`);
            console.log(`   - 주요 카테고리: ${stats.mainCategories.join(', ') || '없음'}`);

            // 영향력 점수 계산
            const influenceScore = calculateInfluenceScore({
                visitorToday: stats.visitorToday,
                visitorTotal: stats.visitorTotal,
                neighborCount: stats.neighborCount,
                avgLikes: 0,
                avgComments: 0
            });

            console.log(`\n🏆 영향력 점수: ${influenceScore}점`);
            
            // 등급 표시
            let grade = 'D급';
            if (influenceScore >= 80) grade = 'S급';
            else if (influenceScore >= 60) grade = 'A급';
            else if (influenceScore >= 40) grade = 'B급';
            else if (influenceScore >= 20) grade = 'C급';
            
            console.log(`   등급: ${grade}`);

        } catch (error) {
            console.error('❌ 크롤링 실패:', error.message);
        }
    }

    console.log('\n\n✨ 테스트 완료!');
}

testCrawler();
