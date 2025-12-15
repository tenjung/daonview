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
                validateStatus: (status) => status < 500,
            });
            finalUrl = initialRes.request.res.responseUrl || url;
        } catch (e) {
            console.error('Initial fetch failed, continuing with original URL:', e.message);
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

        // --- TITLE STRATEGY ---
        // 1. OG Title
        title = $('meta[property="og:title"]').attr('content') || '';
        // 2. Specific Mobile Title Selector
        if (!title || title === '네이버지도') {
            title = $('.Fc1rA').text(); // Common class for title in new mobile view
        }
        // Cleanup
        title = title.replace(/ : 네이버 플레이스$/, '')
            .replace(/ : 네이버 통합검색$/, '')
            .replace(/^네이버 플레이스 - /, '')
            .replace(' : 네이버', ''); // Generic cleanup

        // --- ADDRESS STRATEGY ---
        // 1. Specific Mobile Address Selectors (Class names scramble often, try multiple known ones)
        // .LDgIH is extremely common for address lines in Naver Mobile
        address = $('.LDgIH').text();

        if (!address) {
            // Try looking for span that matches address pattern (ends in "길" or "로" + number)
            // Or look for text following "주소"
            $('span, div, a').each((i, el) => {
                if (address) return;
                const txt = $(el).text().trim();
                // Heuristic: "서울 XX구"
                if (/^(서울|경기|인천|강원|충북|충남|대전|세종|전북|전남|광주|경북|경남|대구|부산|울산|제주)\s/.test(txt) && txt.length > 8 && txt.length < 50) {
                    // Check if it has a number (bunji or road number)
                    if (/\d/.test(txt)) {
                        address = txt;
                    }
                }
            });
        }

        // 2. JSON-LD / Scripts Fallback
        if (!title || !address) {
            $('script').each((i, el) => {
                const txt = $(el).html();
                if (!txt) return;

                // Try JSON-LD
                if ($(el).attr('type') === 'application/ld+json') {
                    try {
                        const json = JSON.parse(txt);
                        const ent = Array.isArray(json) ? json[0] : json;
                        if (!title && ent.name) title = ent.name;
                        if (!address && ent.address) {
                            if (typeof ent.address === 'string') address = ent.address;
                            else if (typeof ent.address === 'object') {
                                address = `${ent.address.addressRegion || ''} ${ent.address.addressLocality || ''} ${ent.address.streetAddress || ''}`.trim();
                            }
                        }
                    } catch (e) { }
                }

                // Try Window State (Apollo) for address
                if (!address && txt.includes('streetAddress')) {
                    try {
                        // Regex extract streetAddress:"..."
                        const match = txt.match(/"streetAddress":"([^"]+)"/);
                        if (match) address = match[1];

                        // Also try common address key
                        const match2 = txt.match(/"address":"([^"]+)"/);
                        if (!address && match2) address = match2[1];
                    } catch (e) { }
                }
            });
        }

        // Remove "복사" (Copy) text if scraped from button
        address = address.replace('복사', '').trim();
        // Remove "도로명" prefix if present
        address = address.replace(/^도로명\s*/, '').replace(/^지번\s*/, '').trim();

        return NextResponse.json({
            title: title.trim(),
            address: address.trim(),
            finalUrl: targetUrl
        });

    } catch (error: any) {
        console.error('Scraping Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch info' }, { status: 500 });
    }
}
