// 네이버 블로그 크롤링 유틸리티
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface BlogContent {
  title: string;
  content: string;
  imageCount: number;
}

/**
 * 네이버 블로그 URL 검증
 */
export function isValidNaverBlogUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('blog.naver.com');
  } catch {
    return false;
  }
}

/**
 * 네이버 블로그 크롤링
 */
export async function crawlNaverBlog(url: string): Promise<BlogContent> {
  if (!isValidNaverBlogUrl(url)) {
    throw new Error('유효한 네이버 블로그 URL이 아닙니다.');
  }

  try {
    // User-Agent 설정으로 크롤링 차단 우회
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    // iframe 내부 컨텐츠 URL 추출 (네이버 블로그는 iframe 구조)
    const mainFrame = $('iframe#mainFrame').attr('src');
    
    if (mainFrame) {
      // iframe 내부 컨텐츠 다시 크롤링
      const frameUrl = mainFrame.startsWith('http') 
        ? mainFrame 
        : `https://blog.naver.com${mainFrame}`;
      
      const frameResponse = await axios.get(frameUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $frame = cheerio.load(frameResponse.data);
      
      // 스마트에디터 ONE (최신 에디터)
      let title = $frame('.se-title-text').first().text().trim();
      let content = $frame('.se-main-container').text().trim();
      let imageCount = $frame('.se-main-container img').length;

      // 구버전 에디터 (pcol1)
      if (!title) {
        title = $frame('.pcol1 .tit_h3').first().text().trim();
        content = $frame('#postViewArea').text().trim();
        imageCount = $frame('#postViewArea img').length;
      }

      // 본문이 없으면 에러
      if (!content) {
        throw new Error('블로그 본문을 찾을 수 없습니다. 비공개 포스팅이거나 접근이 제한된 글일 수 있습니다.');
      }

      return {
        title: title || '제목 없음',
        content,
        imageCount,
      };
    }

    throw new Error('블로그 컨텐츠를 불러올 수 없습니다.');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      throw new Error('블로그를 불러오는 중 오류가 발생했습니다.');
    }
    throw error;
  }
}
