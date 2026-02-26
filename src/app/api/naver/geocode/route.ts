import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * 네이버 검색 엔진이 좋아하는 형태로 주소를 다각도로 가공합니다.
 */
function generateStrategicQueries(address: string): string[] {
    const raw = decodeURIComponent(address).replace(/\(.*\)/g, '').trim();
    const parts = raw.split(/\s+/);
    const queries: string[] = [raw];

    // 1. 상세주소(층, 호, 매장명) 제거 로직
    const cleaned = raw.replace(/\d+층.*$/, '').replace(/\d+호.*$/, '').trim();
    queries.push(cleaned);

    // 2. 도로명 주소 핵심 패턴 추출 (예: "옹기마길 4")
    // 주소의 뒷부분이 보통 "~~로/길 번호" 형태이므로 뒤에서부터 매칭
    const roadMatch = raw.match(/([가-힣\d]+(?:로|길|번길))\s?(\d+(?:-\d+)?)/);
    if (roadMatch) {
        queries.push(`${roadMatch[1]} ${roadMatch[2]}`);
        // 시/군/구와 함께 조합 (성공률 가장 높음)
        if (parts.length >= 2) {
            queries.push(`${parts[0]} ${parts[1]} ${roadMatch[1]} ${roadMatch[2]}`);
        }
    }

    // 3. 지번/리 포함 단어 강제 분리 시도 (예: "명리옹기마길" -> "명리 옹기마길")
    // "리"나 "동" 뒤에 "길/로"가 붙은 경우 분리
    const stickyMatch = raw.match(/([가-힣]+(?:리|동))([가-힣\d]+(?:로|길))/);
    if (stickyMatch) {
        queries.push(raw.replace(stickyMatch[0], `${stickyMatch[1]} ${stickyMatch[2]}`));
    }

    // 4. 단어 뒤에서부터 슬라이싱 (최근 3~4개 단어가 가장 유효)
    if (parts.length > 3) {
        queries.push(parts.slice(-3).join(' '));
        queries.push(parts.slice(-4).join(' '));
    }

    return Array.from(new Set(queries)).filter(q => q.length > 2);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || address === '정보 없음') {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const queries = generateStrategicQueries(address);
    console.log(`[Geocode Proxy] Smart Queries:`, queries);

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;
    let permissionDenied = false;

    for (const query of queries) {
        try {
            const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode', {
                params: { query },
                headers: {
                    'Accept': 'application/json',
                    'X-NCP-APIGW-API-KEY-ID': clientId,
                    'X-NCP-APIGW-API-KEY': clientSecret,
                },
                timeout: 2500
            });

            if (response.data.status === 'OK' && response.data.addresses?.length > 0) {
                const result = response.data.addresses[0];
                console.log(`[Geocode Proxy] SUCCESS for: "${query}"`);
                return NextResponse.json({
                    lat: parseFloat(result.y),
                    lng: parseFloat(result.x)
                });
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const detail = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
            console.warn(`[Geocode Proxy] "${query}" failed (${status || 'NO_STATUS'}): ${detail}`);
            if (status === 401 || status === 403) permissionDenied = true;
        }
    }

    if (permissionDenied) {
        return NextResponse.json(
            { error: 'Geocoding API 권한이 없습니다. NCP에서 Geocoding API 구독 상태를 확인하세요.' },
            { status: 502 }
        );
    }

    return NextResponse.json({ error: '주소를 좌표로 변환할 수 없습니다. 번지수나 길 이름까지만 입력해 보세요.' }, { status: 404 });
}
