'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface NaverStaticMapProps {
    lat: number;
    lng: number;
    storeName?: string;
    width?: number;
    height?: number;
}

/**
 * 네이버 지도 썸네일 컴포넌트
 * - 네이버 공식 지도 썸네일 서비스 사용 (API 키 불필요)
 * - 과금 없음, 공개 URL 방식
 * - 클릭 시 네이버 지도 앱/웹으로 이동
 */
export default function NaverStaticMap({
    lat,
    lng,
    storeName,
    width = 800,
    height = 480
}: NaverStaticMapProps) {
    const [imageError, setImageError] = React.useState(false);

    // 네이버 지도 공식 썸네일 URL (API 키 불필요, 무료)
    // 문서: https://developers.naver.com/docs/utils/mapsstaticmap/
    const thumbnailUrl =
        `https://map.pstatic.net/staticmap/image?` +
        `w=${width}` +
        `&h=${height}` +
        `&center=${lng},${lat}` +
        `&level=16` +
        `&markers=type:d|size:mid|pos:${lng}%20${lat}`;

    // 네이버 지도 앱/웹 링크
    const naverMapUrl = `https://map.naver.com/v5/?c=${lng},${lat},16,0,0,0,dh`;

    console.log('[NaverStaticMap] Thumbnail URL:', thumbnailUrl);
    console.log('[NaverStaticMap] Coordinates:', { lat, lng });

    if (imageError) {
        return (
            <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                </div>
                <p className="text-sm text-slate-600 font-medium">지도를 불러올 수 없습니다</p>
                <p className="text-xs text-slate-400">좌표: {lat}, {lng}</p>
                <a
                    href={naverMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                    네이버 지도에서 보기
                    <ExternalLink size={14} />
                </a>
            </div>
        );
    }

    return (
        <a
            href={naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full rounded-2xl overflow-hidden border border-slate-200/60 bg-slate-50 shadow-xl group cursor-pointer"
        >
            <img
                src={thumbnailUrl}
                alt={storeName || '매장 위치'}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={() => {
                    console.error('[NaverStaticMap] Failed to load thumbnail:', thumbnailUrl);
                    setImageError(true);
                }}
            />

            {/* 매장명 오버레이 */}
            {storeName && (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{storeName}</p>
                </div>
            )}

            {/* 네이버 지도에서 보기 버튼 */}
            <div className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-lg">
                네이버 지도에서 보기
                <ExternalLink size={12} />
            </div>

            {/* Naver Map 표시 */}
            <div className="absolute bottom-4 left-4 pointer-events-none select-none">
                <span className="text-[9px] font-black italic text-slate-300 uppercase tracking-tighter bg-white/80 px-2 py-1 rounded">
                    Naver Map
                </span>
            </div>
        </a>
    );
}
