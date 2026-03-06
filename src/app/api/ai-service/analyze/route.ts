import { NextRequest, NextResponse } from 'next/server';
import { crawlNaverBlog } from '@/lib/crawlers/blogCrawler';
import { analyzeKeywords, calculateKeywordDensity } from '@/lib/analyzers/keywordAnalyzer';
import { analyzeExposure } from '@/lib/analyzers/exposureAnalyzer';
import { BlogAnalysisRequest, BlogAnalysisResult } from '@/types/analysis';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요한 서비스입니다.' },
        { status: 401 }
      );
    }

    const body: BlogAnalysisRequest = await request.json();
    const { url } = body;

    // URL 검증
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 금일 사용 횟수 확인 (KST 기준)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const kstToday = kstDate.toISOString().split('T')[0];
    
    const { count, error: countError } = await supabase
      .from('ai_analysis_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${kstToday}T00:00:00+09:00`)
      .lt('created_at', `${kstToday}T23:59:59+09:00`);

    if (countError) {
      return NextResponse.json(
        { error: '사용 횟수 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (count !== null && count >= 2) {
      return NextResponse.json(
        { error: '일일 AI 분석 제한 횟수(2회)를 모두 소모했습니다. 내일 다시 이용해주세요.' },
        { status: 429 }
      );
    }

    // 1. 블로그 크롤링
    const blogContent = await crawlNaverBlog(url);

    // 2. 키워드 분석 (AI 기반으로 변경됨)
    const keywords = await analyzeKeywords(blogContent.content);

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
      seoAdvice: keywords.seoAdvice,
    };

    // 분석 완료 후 이용 내역 기록
    await supabase.from('ai_analysis_logs').insert({
      user_id: user.id,
      url: url,
    });

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
