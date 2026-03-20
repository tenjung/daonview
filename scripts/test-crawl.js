// 블로그 크롤링 테스트 스크립트 v2
const axios = require('axios');
const cheerio = require('cheerio');

async function testCrawl() {
    const blogId = 'damgow';

    console.log('=== Testing Desktop Version ===');
    try {
        const desktopUrl = `https://blog.naver.com/${blogId}`;
        console.log('Fetching:', desktopUrl);

        const response = await axios.get(desktopUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const bodyText = $('body').text();

        // iframe 찾기
        const iframes = $('iframe');
        console.log('Found iframes:', iframes.length);

        iframes.each((i, elem) => {
            const src = $(elem).attr('src');
            const id = $(elem).attr('id');
            console.log(`  Iframe ${i}: id="${id}", src="${src}"`);
        });

        // mainFrame iframe의 src 가져오기
        const mainFrameSrc = $('#mainFrame').attr('src');
        console.log('\nmainFrame src:', mainFrameSrc);

    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n=== Testing Visitor Count API ===');
    try {
        // 방문자 수 API 직접 호출
        const visitorUrl = `https://blog.naver.com/NVisitorGP0.naver?blogId=${blogId}`;
        console.log('Fetching:', visitorUrl);

        const response = await axios.get(visitorUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        console.log('Response:', response.data);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCrawl();
