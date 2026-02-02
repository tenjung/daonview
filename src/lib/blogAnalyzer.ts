import { getRecentPosts, scrapeMultiplePosts, ScrapedContent } from './blogScraper';
import { analyzeContent, calculateAverageAnalysis, ContentAnalysis } from './contentAnalyzer';
import { analyzeMorphology, extractSearchKeywords, mergeMorphologyAnalyses, MorphologyAnalysis } from './morphologyAnalyzer';
import { searchMultipleKeywords, SearchRanking } from './searchRankAnalyzer';
import { calculateQualityScore, QualityScoreBreakdown } from './qualityScorer';

/**
 * 블로그 분석 결과
 */
export interface BlogAnalysisResult {
    // 기본 정보
    blogUrl: string;
    analyzedPostCount: number;
    
    // 콘텐츠 분석
    avgTextLength: number;
    avgImageCount: number;
    contentDensity: number;
    
    // 형태소 분석
    uniqueNounCount: number;
    mainKeywords: string[];
    
    // 검색 순위
    searchRankings: SearchRanking[];
    avgSearchRank: number;
    
    // 품질 점수
    qualityScore: QualityScoreBreakdown;
    
    // 원본 데이터
    analyzedPosts: Array<{
        title: string;
        url: string;
        textLength: number;
        imageCount: number;
    }>;
}

/**
 * 블로그 URL에서 ID 추출
 */
function extractBlogId(url: string): string | null {
    let match = url.match(/blog\.naver\.com\/([^\/\?]+)/);
    if (match) return match[1];

    match = url.match(/m\.blog\.naver\.com\/([^\/\?]+)/);
    if (match) return match[1];

    return null;
}

/**
 * 네이버 블로그 종합 분석
 * @param blogUrl 블로그 URL
 * @param options 분석 옵션
 */
export async function analyzeBlog(
    blogUrl: string,
    options: {
        postLimit?: number;           // 분석할 포스트 개수 (기본: 2)
        includeSearchRank?: boolean;  // 검색 순위 분석 포함 여부 (기본: true)
        searchKeywordLimit?: number;  // 검색할 키워드 개수 (기본: 3)
    } = {}
): Promise<BlogAnalysisResult> {
    const {
        postLimit = 2,
        includeSearchRank = true,
        searchKeywordLimit = 3
    } = options;

    console.log(`\n[BlogAnalyzer] ========================================`);
    console.log(`[BlogAnalyzer] Starting analysis for: ${blogUrl}`);
    console.log(`[BlogAnalyzer] ========================================\n`);

    try {
        // 블로그 ID 추출
        const blogId = extractBlogId(blogUrl);
        if (!blogId) {
            throw new Error('Invalid blog URL format');
        }

        // Step 1: 최신 포스트 목록 가져오기
        console.log(`[BlogAnalyzer] Step 1: Fetching recent posts...`);
        const posts = await getRecentPosts(blogUrl, postLimit);
        
        if (posts.length === 0) {
            throw new Error('No posts found - blog may be empty or private');
        }

        // Step 2: 포스트 본문 스크래핑
        console.log(`[BlogAnalyzer] Step 2: Scraping ${posts.length} posts...`);
        const scrapedContents = await scrapeMultiplePosts(posts, 1000);

        if (scrapedContents.length === 0) {
            throw new Error('Failed to scrape any posts');
        }

        // Step 3: 콘텐츠 분석
        console.log(`[BlogAnalyzer] Step 3: Analyzing content...`);
        const contentAnalyses = scrapedContents.map(content => analyzeContent(content));
        const avgContentAnalysis = calculateAverageAnalysis(contentAnalyses);

        // Step 4: 형태소 분석
        console.log(`[BlogAnalyzer] Step 4: Analyzing morphology...`);
        const morphologyAnalyses = scrapedContents.map(content => 
            analyzeMorphology(content.textContent)
        );
        const mergedMorphology = mergeMorphologyAnalyses(morphologyAnalyses);

        // Step 5: 검색 키워드 추출
        console.log(`[BlogAnalyzer] Step 5: Extracting search keywords...`);
        const allText = scrapedContents.map(c => c.textContent).join(' ');
        const searchKeywords = extractSearchKeywords(allText, searchKeywordLimit);
        console.log(`[BlogAnalyzer] Extracted keywords: ${searchKeywords.join(', ')}`);

        // Step 6: 검색 순위 확인 (선택적)
        let searchRankings: SearchRanking[] = [];
        if (includeSearchRank && searchKeywords.length > 0) {
            console.log(`[BlogAnalyzer] Step 6: Checking search rankings...`);
            searchRankings = await searchMultipleKeywords(searchKeywords, blogId, 1000);
        } else {
            console.log(`[BlogAnalyzer] Step 6: Skipping search ranking (disabled or no keywords)`);
        }

        // Step 7: 품질 점수 계산
        console.log(`[BlogAnalyzer] Step 7: Calculating quality score...`);
        const qualityScore = calculateQualityScore(
            avgContentAnalysis,
            mergedMorphology,
            searchRankings
        );

        // 평균 검색 순위 계산
        const validRankings = searchRankings.filter(r => r.found && r.rank > 0);
        const avgSearchRank = validRankings.length > 0
            ? Math.round((validRankings.reduce((sum, r) => sum + r.rank, 0) / validRankings.length) * 10) / 10
            : 0;

        // 결과 정리
        const result: BlogAnalysisResult = {
            blogUrl,
            analyzedPostCount: scrapedContents.length,
            
            avgTextLength: avgContentAnalysis.textLength,
            avgImageCount: avgContentAnalysis.imageCount,
            contentDensity: avgContentAnalysis.contentDensity,
            
            uniqueNounCount: mergedMorphology.uniqueNounCount,
            mainKeywords: mergedMorphology.keywords,
            
            searchRankings,
            avgSearchRank,
            
            qualityScore,
            
            analyzedPosts: scrapedContents.map(content => ({
                title: content.title,
                url: content.url,
                textLength: content.textLength,
                imageCount: content.imageCount
            }))
        };

        console.log(`\n[BlogAnalyzer] ========================================`);
        console.log(`[BlogAnalyzer] ✅ Analysis Complete!`);
        console.log(`[BlogAnalyzer] Grade: ${qualityScore.grade} (${qualityScore.totalScore}점)`);
        console.log(`[BlogAnalyzer] - Text: ${avgContentAnalysis.textLength} chars (${qualityScore.textLengthScore}점)`);
        console.log(`[BlogAnalyzer] - Images: ${avgContentAnalysis.imageCount} (${qualityScore.imageCountScore}점)`);
        console.log(`[BlogAnalyzer] - Density: ${avgContentAnalysis.contentDensity} (${qualityScore.contentDensityScore}점)`);
        console.log(`[BlogAnalyzer] - Nouns: ${mergedMorphology.uniqueNounCount} (${qualityScore.morphologyScore}점)`);
        console.log(`[BlogAnalyzer] - Search Rank: ${avgSearchRank} (${qualityScore.searchRankScore}점)`);
        console.log(`[BlogAnalyzer] ========================================\n`);

        return result;

    } catch (error: any) {
        console.error(`\n[BlogAnalyzer] ❌ Analysis failed:`, error.message);
        throw new Error(`Blog analysis failed: ${error.message}`);
    }
}
