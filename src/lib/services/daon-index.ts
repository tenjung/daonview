import * as cheerio from 'cheerio';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 네이버 검색광고 API 환경변수
const NAVER_AD_API_URL = 'https://api.naver.com';
const NAVER_AD_CLIENT_ID = process.env.NAVER_AD_CLIENT_ID || '';
const NAVER_AD_CLIENT_SECRET = process.env.NAVER_AD_CLIENT_SECRET || '';
const NAVER_AD_CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID || '';

// Google Gemini AI Client 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * 네이버 검색광고 API 인증을 위한 서명(Signature) 생성 함수
 */
function generateNaverAdSignature(timestamp: string, method: string, path: string): string {
    const message = `${timestamp}.${method}.${path}`;
    const hmac = crypto.createHmac('sha256', NAVER_AD_CLIENT_SECRET);
    hmac.update(message);
    return hmac.digest('base64');
}

/**
 * 네이버 블로그 URL에서 최신글 제목을 3~5개 가져옵니다.
 */
async function getLatestBlogTitles(blogUrl: string): Promise<string[]> {
    try {
        // 블로그 아이디 추출 (예: https://blog.naver.com/userId)
        const urlObj = new URL(blogUrl);
        let blogId = '';
        if (urlObj.hostname.includes('blog.naver.com')) {
            blogId = urlObj.pathname.replace('/', '');
        } else if (urlObj.hostname.includes('m.blog.naver.com')) {
            blogId = urlObj.pathname.split('/')[1];
        }

        if (!blogId) return [];

        // RSS URL로 최신 글 리스트 가져오기 (PC/모바일 등 HTML구조보다 RSS가 안정적)
        const rssUrl = `https://rss.blog.naver.com/${blogId}`;
        const response = await axios.get(rssUrl, { timeout: 5000 });
        const $ = cheerio.load(response.data, { xmlMode: true });

        const titles: string[] = [];
        $('item title').each((i, el) => {
            if (i >= 3) return false; // 최대 3개 추출로 축소 (부하 및 IP 차단 방지)
            titles.push($(el).text().replace('<![CDATA[', '').replace(']]>', '').trim());
        });

        return titles;
    } catch (error) {
        console.error(`Failed to fetch blog titles: ${blogUrl}`, error);
        return [];
    }
}

/**
 * 단순 어절(띄어쓰기) 분리용 Fallback 함수
 */
function extractKeywordsFallback(title: string): string[] {
    const words = title.replace(/[^가-힣a-zA-Z0-9\s]/g, '').split(/\s+/);
    return words.filter(word => word.length >= 2).slice(0, 3); 
}

/**
 * Google Gemini AI를 활용하여 블로그 제목에서 실제 타겟 마케팅 명사만 추출합니다.
 */
async function extractKeywordsWithAI(title: string): Promise<string[]> {
    try {
        if (!process.env.GOOGLE_AI_API_KEY) {
            console.warn('Google AI API Key missing. Falling back to simple split.');
            return extractKeywordsFallback(title);
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `다음 블로그 제목에서 조회수가 가장 높을 만한 핵심 '정보/마케팅 명사 키워드'를 1~3개만 콤마로 구분해서 추출해줘. 
(조사, 수식어, 의미없는 일상어, '오늘', '내돈내산', '솔직후기', '추천', 숫자 등의 범용어절 제외. 오직 검색에 유효한 구체적 타겟 명사 단어만).
답변은 부연설명 없이 오직 단어들만 콤마로 이어서 할 것.

제목: "${title}"
출력 예시: 곱창전골,담순대`;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const keywords = responseText
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length >= 2)
            .slice(0, 3);
            
        return keywords.length > 0 ? keywords : extractKeywordsFallback(title);
    } catch (error) {
        console.error('AI Keyword Extraction failed, using fallback:', error);
        return extractKeywordsFallback(title);
    }
}

/**
 * 네이버 검색광고 API를 이용하여 키워드의 월간 검색량을 조회합니다.
 */
async function getKeywordSearchVolume(keyword: string): Promise<number> {
    if (!NAVER_AD_CLIENT_ID || !NAVER_AD_CLIENT_SECRET || !NAVER_AD_CUSTOMER_ID) {
        console.warn('Naver Search Ad API keys are not set. Returning fallback volume 0.');
        return 0; 
    }

    try {
        const method = 'GET';
        const path = '/keywordstool';
        const timestamp = Date.now().toString();
        const signature = generateNaverAdSignature(timestamp, method, path);

        const response = await axios.get(`${NAVER_AD_API_URL}${path}?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`, {
            headers: {
                'X-Timestamp': timestamp,
                'X-API-KEY': NAVER_AD_CLIENT_ID,
                'X-Customer': NAVER_AD_CUSTOMER_ID,
                'X-Signature': signature,
            },
            timeout: 5000
        });

        // 응답 데이터에서 검색량 합산 (PC + Mobile)
        if (response.data && response.data.keywordList && response.data.keywordList.length > 0) {
            // 가장 연관도 높은 첫 번째 결과 사용 (입력 키워드와 정확히 일치하는 객체 찾기)
            const matched = response.data.keywordList.find((item: any) => item.relKeyword === keyword.replace(/\s/g, '')) || response.data.keywordList[0];
            
            let pc = matched.monthlyPcQcCnt;
            let mobile = matched.monthlyMobileQcCnt;
            
            // API 응답 데이터가 '< 10' 문자열일 경우 숫자화 (보수적으로 10으로 취급)
            if (typeof pc === 'string') pc = 10;
            if (typeof mobile === 'string') mobile = 10;

            const totalVolume = Number(pc || 0) + Number(mobile || 0);
            return totalVolume;
        }

        return 0;
    } catch (error: any) {
        console.error(`Failed to fetch true volume for keyword "${keyword}":`, error?.response?.data || error.message);
        return 0;
    }
}

/**
 * 특정 키워드로 네이버 검색 시 해당 블로그가 노출되는 순위를 확인합니다. (최대 3페이지 심층 검색)
 */
async function getSearchRank(keyword: string, blogUrl: string): Promise<number> {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const urlObj = new URL(blogUrl);
        const targetId = urlObj.pathname.split('/').filter(p => p)[0]; // userId
        
        // 검색 범위 확장: 1페이지(start=1), 2페이지(start=31), 3페이지(start=61)
        const pages = [1, 31, 61]; 
        
        for (const [pageIndex, startOffset] of pages.entries()) {
            // View 통합 탭(VIEW/블로그) 긁어오기
            const searchUrl = `https://search.naver.com/search.naver?where=view&query=${encodedKeyword}&sm=tab_opt&nso=so%3Ar%2Cp%3Aall&start=${startOffset}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 5000
            });

            const $ = cheerio.load(response.data);
            let rankInPage = -1;

            $('a.title_link').each((i, el) => {
                const href = $(el).attr('href') || '';
                if (href.includes(targetId)) {
                    rankInPage = i + 1;
                    return false; // loop break
                }
            });

            if (rankInPage !== -1) {
                // 전체 누적 순위 = 시작 오프셋 위치 + 페이지 내 순위 - 1
                return startOffset + rankInPage - 1; 
            }
            
            // 페이지 요청 간 딜레이(검색 차단 IP Block 임시 방지)
            if (pageIndex < pages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }

        return -1; // 3페이지 내에도 존재하지 않으면 발견 못 함 (-1 반환)
    } catch (error) {
        console.error(`Failed to get search rank for keyword: ${keyword}`, error);
        return -1;
    }
}

/**
 * 다온지수 핵심 산출 함수
 * 공식: Score = sum( SearchVolume / Rank )
 */
export async function calculateDaonIndex(blogUrl: string): Promise<number> {
    if (!blogUrl) return 0;

    let totalScore = 0;

    // 1. 최신 글 제목 추출
    const titles = await getLatestBlogTitles(blogUrl);
    if (titles.length === 0) return 0;

    for (const title of titles) {
        // 2. 키워드 추출 (Gemini AI 형태소 분석)
        const keywords = await extractKeywordsWithAI(title);

        for (const keyword of keywords) {
            // 3. 검색량 조회
            const volume = await getKeywordSearchVolume(keyword);
            
            // 4. 순위 조회 (1페이지~ 기준 30순위 밖이면 점수 0 처리 등 조정 가능)
            let rank = await getSearchRank(keyword, blogUrl);

            // 5. 점수 계산
            if (rank > 0) {
                totalScore += (volume / rank);
            } else {
                // 노출되지 않으면 패널티 또는 0점 (여기선 0점)
                totalScore += 0;
            }
        }
    }

    // 최종 점수 반올림
    const rawScore = Math.round(totalScore);
    
    // 다온지수 원점수를 1~5 별점으로 치환 (최소 1점 보장)
    let star = 1;
    if (rawScore > 1000 && rawScore <= 5000) star = 2;
    else if (rawScore > 5000 && rawScore <= 20000) star = 3;
    else if (rawScore > 20000 && rawScore <= 50000) star = 4;
    else if (rawScore > 50000) star = 5;

    return star;
}
