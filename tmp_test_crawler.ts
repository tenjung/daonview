import { crawlNaverBlog } from './src/lib/crawlers/blogCrawler';

async function test() {
  try {
    const url = 'https://blog.naver.com/some_user/223000000000'; // Need a real URL to test, or just check the HTML structure
    // Let's first just fetch a real naver blog URL to see the HTML
    const axios = require('axios');
    const response = await axios.get('https://blog.naver.com/post/postView.naver?blogId=example&logNo=123456', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    console.log(response.data.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
test();
