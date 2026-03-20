require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const NAVER_AD_API_URL = 'https://api.naver.com';
const NAVER_AD_CLIENT_ID = process.env.NAVER_AD_CLIENT_ID || '';
const NAVER_AD_CLIENT_SECRET = process.env.NAVER_AD_CLIENT_SECRET || '';
const NAVER_AD_CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID || '';

function generateNaverAdSignature(timestamp, method, path) {
    const message = `${timestamp}.${method}.${path}`;
    const hmac = crypto.createHmac('sha256', NAVER_AD_CLIENT_SECRET);
    hmac.update(message);
    return hmac.digest('base64');
}

async function getKeywordSearchVolume(keyword) {
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

        if (response.data && response.data.keywordList && response.data.keywordList.length > 0) {
            const matched = response.data.keywordList.find((item) => item.relKeyword === keyword.replace(/\s/g, '')) || response.data.keywordList[0];
            let pc = matched.monthlyPcQcCnt;
            let mobile = matched.monthlyMobileQcCnt;
            if (typeof pc === 'string') pc = 10;
            if (typeof mobile === 'string') mobile = 10;
            return Number(pc || 0) + Number(mobile || 0);
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

async function getSearchRank(keyword, blogUrl) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const urlObj = new URL(blogUrl);
        const targetId = urlObj.pathname.split('/').filter(p => p)[0]; // target is 'damgow'
        const pages = [1, 31, 61]; 
        
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const startOffset = pages[pageIndex];
            const searchUrl = `https://search.naver.com/search.naver?where=view&query=${encodedKeyword}&sm=tab_opt&nso=so%3Ar%2Cp%3Aall&start=${startOffset}`;
            
            const response = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 5000
            });

            const $ = cheerio.load(response.data);
            let rankInPage = -1;

            $('a.title_link').each((i, el) => {
                const href = $(el).attr('href') || '';
                if (href.includes(targetId)) {
                    rankInPage = i + 1;
                    return false;
                }
            });

            if (rankInPage !== -1) {
                return startOffset + rankInPage - 1; 
            }
            if (pageIndex < pages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }
        return -1;
    } catch (error) {
        return -1;
    }
}

async function testIndex() {
    console.log("=== Debugging Daon Index for: damgow ===");
    const rssUrl = `https://rss.blog.naver.com/damgow`;
    const response = await axios.get(rssUrl, { timeout: 5000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const titles = [];
    $('item title').each((i, el) => {
        if (i >= 3) return false;
        titles.push($(el).text().replace('<![CDATA[', '').replace(']]>', '').trim());
    });
    
    console.log("1. Titles:", titles);
    let totalScore = 0;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    for (const title of titles) {
        let keywords = [];
        try {
            const prompt = `다음 블로그 제목에서 조회수가 가장 높을 만한 핵심 '정보/마케팅 명사 키워드'를 1~3개만 콤마로 구분해서 추출해줘. (조사, 수식어, 의미없는 일상어, '오늘', '내돈내산', '솔직후기', '추천', 숫자 등의 범용어절 제외. 오직 검색에 유효한 구체적 타겟 명사 단어만). 답변은 부연설명 없이 오직 단어들만 콤마로 이어서 할 것. 제목: "${title}"`;
            const result = await model.generateContent(prompt);
            keywords = result.response.text().split(',').map(k => k.trim()).filter(k => k.length >= 2).slice(0, 3);
        } catch(e) {
            console.error(e);
            keywords = title.replace(/[^가-힣a-zA-Z0-9\s]/g, '').split(/\s+/).filter(word => word.length >= 2).slice(0, 3);
        }
        
        console.log(`\nAI Extracted Keywords for "${title}":`, keywords);
        
        for (const keyword of keywords) {
            const vol = await getKeywordSearchVolume(keyword);
            const rank = await getSearchRank(keyword, 'https://blog.naver.com/damgow');
            console.log(`  - Keyword [${keyword}]: Volume=${vol}, Rank=${rank}`);
            if (rank > 0) {
                totalScore += (vol / rank);
            }
        }
    }
    console.log(`\n=== FINAL DAON SCORE: ${Math.round(totalScore)} ===`);
}

testIndex();
