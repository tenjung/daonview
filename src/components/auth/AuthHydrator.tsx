'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthHydratorProps {
    user: any | null;
    profile: any | null;
}

/**
 * 서버 사이드에서 가져온 유저 세션 및 프로필 데이터를
 * 클라이언트 측 Zustand 스토어에 즉시 주입(Hydrate)하는 컴포넌트입니다.
 *
 * ✅ 수정: 서버에서 실제 세션 데이터를 받아 주입하므로
 *          페이지 이동 시 로그인 상태가 끊기는 문제를 해결합니다.
 */
export default function AuthHydrator({ user, profile }: AuthHydratorProps) {
    const hydrate = useAuthStore((state) => state.hydrate);
    const hasHydrated = useRef(false);

    // 렌더링 단계에서 하이드레이션 (useEffect보다 빠르게 적용)
    if (!hasHydrated.current) {
        hydrate(user, profile);
        hasHydrated.current = true;
    }

    return null;
}
