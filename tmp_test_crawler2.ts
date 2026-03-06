import { normalizeNaverBlogUrl, crawlNaverBlog } from './src/lib/crawlers/blogCrawler';

async function test() {
  const testUrls = [
    'https://blog.naver.com/someuser/2233445566',
    'https://m.blog.naver.com/someuser/2233445566',
    'http://blog.naver.com/someuser/123',
    'https://blog.naver.com/someuser?Redirect=Log&logNo=123',
    'invalid-url',
    'https://google.com'
  ];

  for (const url of testUrls) {
      console.log(`URL: ${url} -> Normalized: ${normalizeNaverBlogUrl(url)}`);
  }
}
test();
