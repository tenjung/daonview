import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

interface Subscription {
    id: string;
    plan: string;
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
    starts_at: string;
    expires_at: string;
}

interface UseSubscriptionResult {
    subscription: Subscription | null;
    isUnlimited: boolean;   // 현재 유효한 무제한 이용권이 있는가 (ACTIVE or CANCELLED-but-not-expired)
    isCancelled: boolean;   // 해지 예약 상태 (CANCELLED + 아직 만료 전)
    isLoading: boolean;
    refetch: () => void;
}

export function useSubscription(): UseSubscriptionResult {
    const { user } = useAuthStore();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!user?.id) {
            setSubscription(null);
            setIsLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            setIsLoading(true);
            try {
                // ACTIVE 또는 CANCELLED(기간 내)인 구독 모두 조회
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('status', ['ACTIVE', 'CANCELLED'])
                    .gt('expires_at', new Date().toISOString()) // 만료일이 미래인 것만
                    .order('expires_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;
                setSubscription(data ?? null);
            } catch (err) {
                console.error('[useSubscription] fetch error:', err);
                setSubscription(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscription();
    }, [user?.id, tick]);

    const isCancelled = subscription?.status === 'CANCELLED';
    const isUnlimited = subscription !== null; // ACTIVE or CANCELLED(기간 내) 모두 이용 가능

    return {
        subscription,
        isUnlimited,
        isCancelled,
        isLoading,
        refetch: () => setTick(t => t + 1),
    };
}
