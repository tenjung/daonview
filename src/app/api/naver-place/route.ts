import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // 1. Resolve final URL (handling shortlinks like naver.me)
        let finalUrl = url;
        let placeId = '';

        try {
            const initialRes = await axios.get(url, {
                httpsAgent: agent,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                },
                timeout: 5000,
                maxRedirects: 5,
                validateStatus: (status: number) => status < 500,
            });
            finalUrl = initialRes.request.res.responseUrl || url;
        } catch (e) {
            console.error('Initial fetch failed, continuing with original URL:', e instanceof Error ? e.message : String(e));
        }

        // 2. Extract Place ID
        // Supports: map.naver.com/p/entry/place/123456...  or  m.place.naver.com/place/123456...
        const match = finalUrl.match(/\/place\/(\d+)/);
        if (match) {
            placeId = match[1];
        }

        // 3. Determine Search URL & User-Agent
        let targetUrl = finalUrl;
        let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36';

        if (placeId) {
            // Force Mobile Place URL which is easier to scrape
            targetUrl = `https://m.place.naver.com/place/${placeId}/home`;
            // Use Mobile UA
            userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
        }

        // 4. Fetch Target Page
        console.log(`Fetching Naver Info from: ${targetUrl} (ID: ${placeId})`);

        const response = await axios.get(targetUrl, {
            httpsAgent: agent,
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://m.place.naver.com/',
            },
            timeout: 8000
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let title = '';
        let address = '';

        // --- 1. JSON-LD Strategy (Highest Priority) ---
        $('script[type="application/ld+json"]').each((_i, el) => {
            try {
                const json = JSON.parse($(el).html() || '{}');
                const ent = Array.isArray(json) ? json[0] : json;
                
                if (ent.name && !title) title = ent.name;
                
                if (ent.address && !address) {
                    if (typeof ent.address === 'string') {
                        address = ent.address;
                    } else if (typeof ent.address === 'object') {
                        // Use streetAddress or combination
                        address = ent.address.streetAddress || 
                                 `${ent.address.addressRegion || ''} ${ent.address.addressLocality || ''} ${ent.address.streetAddress || ''}`.trim();
                    }
                }
            } catch (e) {
                console.error('JSON-LD parse error:', e);
            }
        });

        // --- 2. Window State Strategy (Second Priority) ---
        if (!title || !address || !address.includes('길') && !address.includes('로')) {
            $('script').each((_i, el) => {
                const txt = $(el).html() || '';
                if (txt.includes('window.__APOLLO_STATE__') || txt.includes('roadAddress')) {
                    // Try to find Name
                    const nameMatch = txt.match(/"name":"([^"]+)"/);
                    if (!title && nameMatch) title = nameMatch[1];

                    // Priority 1: roadAddress (This is precisely what the user wants)
                    const roadMatch = txt.match(/"roadAddress":"([^"]+)"/);
                    if (roadMatch) {
                        address = roadMatch[1];
                    } else {
                        // Priority 2: streetAddress
                        const addrMatch = txt.match(/"streetAddress":"([^"]+)"/);
                        if (!address && addrMatch) address = addrMatch[1];

                        // Priority 3: common address key
                        const addrMatch2 = txt.match(/"address":"([^"]+)"/);
                        if (!address && addrMatch2) address = addrMatch2[1];
                    }
                }
            });
        }

        // --- 3. DOM Fallback Strategy ---
        if (!title) {
            title = $('meta[property="og:title"]').attr('content') || '';
            if (!title || title.includes('네이버지도')) {
                title = $('.Fc1rA').first().text() || $('.X0_Yp').first().text() || '';
            }
        }

        if (!address || !address.includes('길') && !address.includes('로')) {
            // Try specific road name selectors or text matching
            $('.LDgIH, .Lp1H8, .y9_vA, .v9_vA').each((_i, el) => {
                const txt = $(el).text().trim();
                if (txt.includes('도로명') || (txt.includes('길') || txt.includes('로')) && txt.length > 5) {
                    address = txt;
                }
            });
            
            if (!address) {
                // Last ditch DOM search
                address = $('.LDgIH').first().text() || $('.Lp1H8').first().text() || '';
            }
        }

        // --- 4. Robust Cleanup ---
        function cleanText(text: string, isTitle: boolean = false) {
            if (!text) return '';
            
            let cleaned = text;

            // Common Noise
            const noise = [
                '지도', '내비게이션', '거리뷰', '복사', '공유', '저장', '기타',
                '리뷰', '사진', '메뉴', '홈', '예약', '톡톡', '전화'
            ];

            if (isTitle) {
                cleaned = cleaned
                    .replace(/ : 네이버 플레이스$/, '')
                    .replace(/ : 네이버 통합검색$/, '')
                    .replace(/^네이버 플레이스 - /, '')
                    .replace(/ : 네이버$/, '')
                    .replace(/\(.*\)$/, ''); // Remove (city names) or (type)
            }

            // Remove trailing noise words that often get merged
            noise.forEach(word => {
                // Regex to remove word if it's at the end or followed by other navigation terms
                const regex = new RegExp(`${word}$`, 'g');
                cleaned = cleaned.replace(regex, '');
            });

            // Address specific cleanup
            if (!isTitle) {
                // Fix: Remove "도로명" or "지번" prefix only (not everything after them)
                cleaned = cleaned.replace(/^도로명\s*/, '').replace(/^지번\s*/, '').trim();
                
                // If the address ends with noise combined words (like "카페수플지도")
                // This usually happens when scraping raw text from a container
                cleaned = cleaned.replace(/(지도|내비게이션|거리뷰|복사)+$/, '');
            }

            return cleaned.trim();
        }

        title = cleanText(title, true);
        address = cleanText(address, false);

        // Final sanity check: if title is still messy, try to extract first part
        if (title.length > 50) title = title.split(' ')[0];

        return NextResponse.json({
            title: title || '정보 없음',
            address: address || '정보 없음',
            finalUrl: targetUrl
        });

    } catch (error: any) {
        console.error('Scraping Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch info' }, { status: 500 });
    }
}
