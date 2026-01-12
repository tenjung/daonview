import { NextRequest, NextResponse } from 'next/server';
import { crawlNaverBlog } from '@/lib/crawlers/blogCrawler';
import { analyzeKeywords, calculateKeywordDensity } from '@/lib/analyzers/keywordAnalyzer';
import { analyzeExposure } from '@/lib/analyzers/exposureAnalyzer';
import { BlogAnalysisRequest, BlogAnalysisResult } from '@/types/analysis';

export async function POST(request: NextRequest) {
  try {
    const body: BlogAnalysisRequest = await request.json();
    const { url } = body;

    // URL 검증
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 1. 블로그 크롤링
    const blogContent = await crawlNaverBlog(url);

    // 2. 키워드 분석
    const keywords = analyzeKeywords(blogContent.content);

    // 3. 통계 계산
    const wordCount = blogContent.content.replace(/\s/g, '').length;
    const allKeywords = [...keywords.primary, ...keywords.secondary];
    const keywordDensity = calculateKeywordDensity(allKeywords, wordCount);

    // 4. 검색 노출도 분석
    const primaryKeywordWords = keywords.primary.map(k => k.word);
    const exposure = await analyzeExposure(primaryKeywordWords);

    // 5. 결과 반환
    const result: BlogAnalysisResult = {
      title: blogContent.title,
      content: blogContent.content.substring(0, 500), // 미리보기용 500자만
      stats: {
        wordCount,
        imageCount: blogContent.imageCount,
        keywordDensity,
      },
      keywords,
      exposure,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('블로그 분석 오류:', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : '블로그 분석 중 오류가 발생했습니다.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
