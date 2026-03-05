require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
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

async function testNaverApi() {
    console.log('Testing Naver Search Ad API...');
    const keyword = '강남역맛집';
    const method = 'GET';
    const path = '/keywordstool';
    const timestamp = Date.now().toString();
    const signature = generateNaverAdSignature(timestamp, method, path);

    try {
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
            const matched = response.data.keywordList[0];
            let pc = matched.monthlyPcQcCnt;
            let mobile = matched.monthlyMobileQcCnt;
            
            if (typeof pc === 'string') pc = 10;
            if (typeof mobile === 'string') mobile = 10;

            console.log(`[SUCCESS] Keyword: ${matched.relKeyword}`);
            console.log(`- PC Monthly Search: ${pc}`);
            console.log(`- Mobile Monthly Search: ${mobile}`);
            console.log(`- Total: ${Number(pc) + Number(mobile)}`);
        } else {
            console.log('No data returned from keyword pool');
        }
    } catch (error) {
        console.error('[ERROR] API Failed:');
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testNaverApi();
