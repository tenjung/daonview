'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * [수칙 준수] 상태값 상수화 (UPPERCASE_STRING)
 */
const MAP_STATUS = {
    LOADING: 'LOADING',
    READY: 'READY',
    ERROR: 'ERROR'
} as const;

interface NaverMapProps {
    address: string;
    storeName?: string;
    lat?: number | null;
    lng?: number | null;
}

export default function NaverMap({ address, storeName, lat, lng }: NaverMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<keyof typeof MAP_STATUS>(MAP_STATUS.LOADING);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const mapInstance = useRef<any>(null);

    // 공백 제거 및 환경변수 로드
    const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim();

    useEffect(() => {
        let isMounted = true;
        let pollInterval: ReturnType<typeof setInterval> | null = null;

        const hasValidCoords = (targetLat: unknown, targetLng: unknown) =>
            Number.isFinite(Number(targetLat)) && Number.isFinite(Number(targetLng));

        if (!CLIENT_ID) {
            setStatus(MAP_STATUS.ERROR);
            setErrorMsg("클라이언트 ID가 설정되지 않았습니다.");
            return;
        }

        // 네이버 지도 인증 실패 핸들러 (공식 문서 권장)
        (window as any).navermap_authFailure = function () {
            if (isMounted) {
                setStatus(MAP_STATUS.ERROR);
                setErrorMsg("네이버 지도 인증에 실패했습니다. Client ID와 Web 서비스 URL을 확인해주세요.");
            }
        };

        const drawMap = (targetLat: number, targetLng: number) => {
            if (!mapRef.current || !isMounted) return;
            const { naver } = window as any;

            if (!naver?.maps) return;

            try {
                const location = new naver.maps.LatLng(targetLat, targetLng);

                // 이미 인스턴스가 있으면 위치만 이동
                if (mapInstance.current) {
                    mapInstance.current.setCenter(location);
                } else {
                    mapInstance.current = new naver.maps.Map(mapRef.current, {
                        center: location,
                        zoom: 17,
                        mapDataControl: false,
                        scaleControl: true,
                        logoControl: true,
                    });
                }

                // 네이버 기본 마커 사용
                new naver.maps.Marker({
                    position: location,
                    map: mapInstance.current,
                    title: storeName || '매장 위치',
                    animation: naver.maps.Animation.DROP
                });

                setStatus(MAP_STATUS.READY);
            } catch (e) {
                console.error('[NaverMap] Render Error:', e);
                setStatus(MAP_STATUS.ERROR);
                setErrorMsg("지도를 표시하는 중 오류가 발생했습니다.");
            }
        };

        const loadScript = () => {
            const scriptId = 'naver-map-script';
            const existingScript = document.getElementById(scriptId) as HTMLScriptElement;

            if (existingScript) return;

            const script = document.createElement('script');
            script.id = scriptId;
            script.type = 'text/javascript';
            const scriptUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`;

            // 디버깅: 실제 사용되는 Client ID와 URL 확인
            console.log('[NaverMap] Loading script with Client ID:', CLIENT_ID);
            console.log('[NaverMap] Script URL:', scriptUrl);
            console.log('[NaverMap] Current origin:', window.location.origin);

            script.src = scriptUrl;
            script.async = true;

            script.onload = () => {};

            script.onerror = () => {
                if (isMounted) {
                    setStatus(MAP_STATUS.ERROR);
                    setErrorMsg("네이버 지도 라이브러리를 불러올 수 없습니다.");
                }
            };

            document.head.appendChild(script);
        };

        const waitForNaverMap = () =>
            new Promise<void>((resolve, reject) => {
                const startedAt = Date.now();
                pollInterval = setInterval(() => {
                    if ((window as any).naver?.maps?.LatLng) {
                        if (pollInterval) clearInterval(pollInterval);
                        pollInterval = null;
                        resolve();
                        return;
                    }
                    if (Date.now() - startedAt > 10000) {
                        if (pollInterval) clearInterval(pollInterval);
                        pollInterval = null;
                        reject(new Error('NAVER_MAP_LOAD_TIMEOUT'));
                    }
                }, 100);
            });

        const resolveCoordinates = async () => {
            if (hasValidCoords(lat, lng)) {
                return { lat: Number(lat), lng: Number(lng) };
            }

            if (!address?.trim()) {
                throw new Error('INVALID_ADDRESS');
            }

            throw new Error('MISSING_COORDS');
        };

        const initializeMap = async () => {
            try {
                loadScript();
                await waitForNaverMap();
                if (!isMounted) return;
                const coords = await resolveCoordinates();
                drawMap(coords.lat, coords.lng);
            } catch (e) {
                console.error('[NaverMap] Initialize Error:', e);
                if (isMounted) {
                    setStatus(MAP_STATUS.ERROR);
                    setErrorMsg('지도를 불러올 수 없습니다. 주소 또는 좌표를 확인해주세요.');
                }
            }
        };

        setStatus(MAP_STATUS.LOADING);
        setErrorMsg(null);
        initializeMap();

        return () => {
            isMounted = false;
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        };
    }, [lat, lng, address, CLIENT_ID]);

    const copyOrigin = () => {
        const origin = window.location.origin;
        // www 제거 (네이버 콘솔 정책)
        const urlWithoutWww = origin.replace('://www.', '://');
        
        navigator.clipboard.writeText(urlWithoutWww).then(() => {
            alert(`✅ 복사 완료!\n\nNCP 콘솔의 [Web 서비스 URL]에 아래 주소를 추가하세요:\n\n${urlWithoutWww}\n\n⚠️ 네이버 콘솔 정책: www는 빼고 등록해야 합니다!`);
        });
    };

    return (
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-slate-200/60 bg-slate-50 shadow-xl min-h-[480px] transition-all duration-500">
            <div
                ref={mapRef}
                className={`w-full h-[480px] transition-opacity duration-700 ${status === MAP_STATUS.READY ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            {status === MAP_STATUS.LOADING && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md z-10 transition-opacity">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500/10 border-t-rose-500 mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Map Loading...</p>
                </div>
            )}

            {status === MAP_STATUS.ERROR && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/95 backdrop-blur-md z-20">
                    <div className="mb-6 h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h5 className="font-black text-slate-900 mb-2">지도가 표시되지 않나요?</h5>
                    <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
                        NCP(VPC) 콘솔 설정이 맞지 않으면 지도가 사라집니다.<br />
                        <strong className="text-rose-600">www를 제외한 도메인</strong>을 등록해야 합니다.
                    </p>
                    
                    {/* 현재 접속 URL 표시 */}
                    <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-[10px] text-slate-400 mb-1">NCP 콘솔에 등록할 URL:</p>
                        <code className="text-[11px] font-mono text-rose-600 font-bold">
                            {typeof window !== 'undefined' 
                                ? window.location.origin.replace('www.', '') 
                                : ''}
                        </code>
                        <p className="text-[9px] text-slate-400 mt-2">
                            ⚠️ www는 빼고 등록하세요
                        </p>
                    </div>

                    <div className="w-full max-w-[240px] space-y-3">
                        <button
                            onClick={copyOrigin}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            URL 주소 복사하기 📋
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold active:scale-95 transition-all"
                            >
                                다시 시도
                            </button>
                            <a
                                href="https://console.ncloud.com/naver-service/application"
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-[11px] font-bold active:scale-95 transition-all text-center"
                            >
                                NCP 콘솔
                            </a>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 w-full max-w-[200px]">
                        <p className="text-[9px] text-slate-300 font-mono tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                            ID: {CLIENT_ID}
                        </p>
                    </div>
                </div>
            )}

            <div className={`absolute top-6 left-8 pointer-events-none select-none transition-opacity duration-1000 ${status === MAP_STATUS.READY ? 'opacity-100' : 'opacity-0'
                }`}>
                <span className="text-[10px] font-black italic text-slate-200 uppercase tracking-tighter">Naver Maps Core API (VPC)</span>
            </div>
        </div>
    );
}
