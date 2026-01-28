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

        // 1. URL 리다이렉트 처리
        let finalUrl = url;
        try {
            const initialRes = await axios.get(url, {
                httpsAgent: agent,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                },
                timeout: 5000,
                maxRedirects: 10
            });
            finalUrl = initialRes.request.res.responseUrl || url;
        } catch (e) { }

        // 2. 플레이스 ID 추출
        const placeMatch = finalUrl.match(/\/(?:place|restaurant|accommodation|medical|beauty|culture|etc)\/(\d+)/) || finalUrl.match(/\/(\d{8,15})(?:\/|\?|$)/);
        const placeId = placeMatch ? placeMatch[1] : null;

        const targetUrl = placeId
            ? `https://m.place.naver.com/place/${placeId}/home`
            : finalUrl;

        // 3. 페이지 획득 및 좌표 파싱 (극단적 탐색)
        const response = await axios.get(targetUrl, {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://m.place.naver.com/',
            },
            timeout: 8000
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let title = '';
        let address = '';
        let lat = '';
        let lng = '';

        // --- 추출 전략: JSON-LD ---
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse($(el).html() || '{}');
                const ent = Array.isArray(json) ? json[0] : json;
                if (ent.name && !title) title = ent.name;
                if (ent.address) address = typeof ent.address === 'string' ? ent.address : ent.address.streetAddress;
                if (ent.geo) {
                    lat = ent.geo.latitude?.toString();
                    lng = ent.geo.longitude?.toString();
                }
            } catch (e) { }
        });

        // --- 추출 전략: 정규식 (Apollo State 등 모든 구석 조사) ---
        if (!lat || !lng) {
            // "x": "127.xxxx", "y": "37.xxxx" 형태 탐색
            const coords = html.match(/"(?:x|displayX|lng)":\s*"?([\d.]+)"?,\s*"(?:y|displayY|lat)":\s*"?([\d.]+)"?/);
            if (coords) {
                lng = coords[1];
                lat = coords[2];
            }
        }

        if (!address) {
            const addrMatch = html.match(/"roadAddress":"([^"]+)"/) || html.match(/"address":"([^"]+)"/);
            if (addrMatch) address = addrMatch[1];
        }

        // --- 후처리 ---
        const resultTitle = (title || $('meta[property="og:title"]').attr('content') || '').split(' : ')[0].replace(/\(.*\)$/, '').trim();
        const resultAddress = (address || '').replace(/복사$/, '').replace(/지도보기$/, '').trim();

        return NextResponse.json({
            title: resultTitle || '정보 없음',
            address: resultAddress || '정보 없음',
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            finalUrl: targetUrl
        });

    } catch (error: any) {
        return NextResponse.json({ error: '데이터 추출 실패' }, { status: 500 });
    }
}
