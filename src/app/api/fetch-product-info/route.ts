import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 네이버 스마트스토어 또는 쿠팡 URL 검증
        const isNaverStore = url.includes('smartstore.naver.com') || url.includes('shopping.naver.com');
        const isCoupang = url.includes('coupang.com') || url.includes('link.coupang.com');
        
        if (!isNaverStore && !isCoupang) {
            return NextResponse.json({ 
                error: '현재 네이버 스마트스토어와 쿠팡만 지원합니다.' 
            }, { status: 400 });
        }

        // 쿠팡용 브라우저 헤더 강화
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Device-Memory': '8',
            'Downlink': '10',
            'ECT': '4g',
            'RTT': '50',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://www.google.com/',
        };

        // 외부 URL에서 HTML 가져오기
        const response = await fetch(url, {
            headers,
            redirect: 'follow', // 리다이렉트 자동 추적
        });

        if (!response.ok) {
            console.error(`Fetch failed for URL: ${url}, Status: ${response.status}`);
            const errorText = await response.text();
            console.error(`Error body snippet: ${errorText.substring(0, 200)}`);
            
            return NextResponse.json({ 
                error: `상품 정보를 가져올 수 없습니다. (상태 코드: ${response.status})` 
            }, { status: response.status });
        }

        const html = await response.text();

        // Open Graph 메타태그에서 상품명 추출
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

        let productName = '';

        if (ogTitleMatch && ogTitleMatch[1]) {
            productName = ogTitleMatch[1].trim();
        } else if (titleMatch && titleMatch[1]) {
            productName = titleMatch[1].trim();
        }

        // HTML 엔티티 복사 (예: &amp; -> &)
        productName = productName
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");

        // 플랫폼별 불필요한 텍스트 제거
        if (isNaverStore) {
            productName = productName.replace(/\s*:\s*네이버\s*쇼핑.*$/i, '');
            productName = productName.replace(/\s*-\s*네이버\s*쇼핑.*$/i, '');
        } else if (isCoupang) {
            productName = productName.replace(/\s*-\s*쿠팡.*$/i, '');
            productName = productName.replace(/\s*\|\s*쿠팡.*$/i, '');
            productName = productName.replace(/^쿠팡\s*!\s*/i, '');
        }

        if (!productName || productName === 'Coupang' || productName === '쿠팡') {
            return NextResponse.json({ 
                error: '상품명을 찾을 수 없습니다. 쿠팡 보안 정책으로 인해 접근이 차단되었을 수 있습니다.' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            productName,
            success: true 
        });

    } catch (error: any) {
        console.error('Error fetching product info:', error);
        return NextResponse.json({ 
            error: error.message || '상품 정보를 가져오는 중 오류가 발생했습니다.' 
        }, { status: 500 });
    }
}

