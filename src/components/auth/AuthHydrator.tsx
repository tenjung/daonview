'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthHydratorProps {
    user: unknown | null;
    profile: unknown | null;
}

/**
 * 서버 사이드에서 가져온 유저 세션 및 프로필 데이터를
 * 클라이언트 측 Zustand 스토어에 즉시 주입(Hydrate)하는 컴포넌트입니다.
 */
export default function AuthHydrator({ user, profile }: AuthHydratorProps) {
    const hydrate = useAuthStore((state) => state.hydrate);

    useEffect(() => {
        hydrate(user, profile);
    }, [user, profile, hydrate]);

    return null;
}
