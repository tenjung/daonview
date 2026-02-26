'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AdminControlsProps {
    campaignId: string | number;
    canEdit: boolean;
}

export default function AdminControls({ campaignId, canEdit }: AdminControlsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);

    if (!canEdit) return null;

    const handleEditClick = async () => {
        if (isNavigating) return;
        setIsNavigating(true);

        try {
            // Middleware는 서버 쿠키 기준으로 인증을 판단하므로,
            // 진입 전 브라우저 세션을 한번 강제 동기화해 false redirect를 줄인다.
            const { data, error } = await supabase.auth.getSession();
            const hasSession = Boolean(data.session);

            if (error || !hasSession) {
                router.push(`/login?returnTo=${encodeURIComponent(pathname || `/campaigns/${campaignId}`)}`);
                return;
            }

            router.push(`/dashboard/campaign/new?id=${campaignId}`);
        } catch (error) {
            console.error('Edit navigation sync error:', error);
            toast.error('세션 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsNavigating(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleEditClick}
            disabled={isNavigating}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-all shadow-sm ml-auto"
        >
            <Settings className="w-3 h-3" />
            {isNavigating ? '이동 중...' : '수정'}
        </button>
    );
}
