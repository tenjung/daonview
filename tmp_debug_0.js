require('dotenv').config({ path: '.env.local' });
const { calculateDaonIndex } = require('./src/lib/services/daon-index.ts');

// We need to compile or run ts-node.
// Let's create a quick JS script that mimics the logic to see what's happening.
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

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
        const searchUrl = `https://search.naver.com/search.naver?where=view&query=${encodedKeyword}&sm=tab_opt&nso=so%3Ar%2Cp%3Aall`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        const $ = cheerio.load(response.data);
        let rank = -1;

        const urlObj = new URL(blogUrl);
        const targetId = urlObj.pathname.split('/').filter(p => p)[0]; // target is 'damgow'

        $('a.title_link').each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes(targetId)) {
                rank = i + 1;
                return false;
            }
        });

        return rank;
    } catch (error) {
        return -1;
    }
}

async function testIndex() {
    console.log("=== Debugging Daon Index for: damgow ===");
    
    // 1. Get RSS titles
    const rssUrl = `https://rss.blog.naver.com/damgow`;
    const response = await axios.get(rssUrl, { timeout: 5000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const titles = [];
    $('item title').each((i, el) => {
        if (i >= 3) return false;
        titles.push($(el).text().replace('<![CDATA[', '').replace(']]>', '').trim());
    });
    
    console.log("1. Extracted Titles:", titles);
    
    let totalScore = 0;

    for (const title of titles) {
        // extract keywords
        const words = title.replace(/[^가-힣a-zA-Z0-9\s]/g, '').split(/\s+/);
        const keywords = words.filter(word => word.length >= 2).slice(0, 3);
        console.log(`\nAnalyzing Title: "${title}" -> Keywords:`, keywords);
        
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
