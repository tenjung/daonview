/**
 * 블로그 분석 엔진 테스트 스크립트
 * 
 * 사용법:
 * node --loader ts-node/esm test-blog-analyzer.ts
 * 또는
 * tsx test-blog-analyzer.ts
 */

import { analyzeBlog } from './src/lib/blogAnalyzer';

async function testAnalyzer() {
    console.log('🧪 블로그 분석 엔진 테스트 시작\n');

    // 테스트할 블로그 URL (예시)
    const testBlogUrl = 'https://blog.naver.com/YOUR_BLOG_ID';

    try {
        console.log(`📝 분석 대상: ${testBlogUrl}\n`);

        const result = await analyzeBlog(testBlogUrl, {
            postLimit: 2,
            includeSearchRank: true,
            searchKeywordLimit: 3
        });

        console.log('\n✅ 분석 완료!\n');
        console.log('='.repeat(60));
        console.log('📊 분석 결과');
        console.log('='.repeat(60));
        console.log(`🏆 등급: ${result.qualityScore.grade}`);
        console.log(`📈 총점: ${result.qualityScore.totalScore}점\n`);

        console.log('📝 세부 점수:');
        console.log(`  - 본문 길이: ${result.avgTextLength}자 (${result.qualityScore.textLengthScore}점)`);
        console.log(`  - 이미지 개수: ${result.avgImageCount}개 (${result.qualityScore.imageCountScore}점)`);
        console.log(`  - 콘텐츠 밀도: ${result.contentDensity} (${result.qualityScore.contentDensityScore}점)`);
        console.log(`  - 형태소 다양성: ${result.uniqueNounCount}개 (${result.qualityScore.morphologyScore}점)`);
        console.log(`  - 검색 순위: ${result.avgSearchRank}위 (${result.qualityScore.searchRankScore}점)\n`);

        console.log('🔑 주요 키워드:');
        result.mainKeywords.forEach((keyword, i) => {
            console.log(`  ${i + 1}. ${keyword}`);
        });

        if (result.searchRankings.length > 0) {
            console.log('\n🔍 검색 순위:');
            result.searchRankings.forEach(ranking => {
                const status = ranking.found ? `${ranking.rank}위` : '100위 밖';
                console.log(`  - "${ranking.keyword}": ${status}`);
            });
        }

        console.log('\n📄 분석된 포스트:');
        result.analyzedPosts.forEach((post, i) => {
            console.log(`  ${i + 1}. ${post.title}`);
            console.log(`     글자: ${post.textLength}, 이미지: ${post.imageCount}`);
        });

        console.log('\n' + '='.repeat(60));

    } catch (error: any) {
        console.error('\n❌ 분석 실패:', error.message);
        console.error('\n상세 오류:', error);
    }
}

// 실행
testAnalyzer();
