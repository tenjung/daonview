'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase/client';

export default function AuthBootstrap() {
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;
        let refreshInFlight = false;

        const ensureFreshSession = async () => {
            if (refreshInFlight) return;

            refreshInFlight = true;
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.user) return;

                // 만료 3분 이내면 선제 갱신
                const expiresAt = (session.expires_at ?? 0) * 1000;
                const remainingMs = expiresAt - Date.now();
                if (remainingMs <= 3 * 60 * 1000) {
                    await supabase.auth.refreshSession();
                }
            } catch (error) {
                const isExpectedMissingSession =
                    typeof error === 'object' &&
                    error !== null &&
                    'name' in error &&
                    String((error as { name?: string }).name) === 'AuthSessionMissingError';

                if (!isExpectedMissingSession) {
                    console.error('[AuthBootstrap] 세션 갱신 점검 오류:', error);
                }
            } finally {
                refreshInFlight = false;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void ensureFreshSession();
            }
        };

        void ensureFreshSession();
        intervalId = setInterval(() => {
            void ensureFreshSession();
        }, 4 * 60 * 1000);

        window.addEventListener('focus', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (intervalId) clearInterval(intervalId);
            window.removeEventListener('focus', handleVisibilityChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
}
