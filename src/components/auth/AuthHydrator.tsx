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
 * 이를 통해 헤더 로딩(Skeleton) 현상을 완전히 제거합니다.
 */
export default function AuthHydrator({ user, profile }: AuthHydratorProps) {
    const hydrate = useAuthStore((state) => state.hydrate);
    const hasHydrated = useRef(false);

    // 렌더링 단계에서 하이드레이션을 시도합니다. (useEffect보다 빠르게 적용)
    if (!hasHydrated.current) {
        if (user) {
            hydrate(user, profile);
        } else {
            // 로그인 상태가 아님을 즉시 반영
            useAuthStore.setState({ isLoading: false });
            (useAuthStore.getState() as any).__initialized = true;
        }
        hasHydrated.current = true;
    }

    return null; // UI는 렌더링하지 않음
}
