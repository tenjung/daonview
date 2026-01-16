import { SupabaseClient } from '@supabase/supabase-js';

export interface CampaignCounts {
    pending: number;
    upcoming: number;
    active: number;
    completed: number;
    draft: number;
}

/**
 * 어드민 사이드바에 표시될 캠페인 상태별 개수를 가져옵니다.
 * 서버 컴포넌트에서 호출하여 초기 데이터를 주입하는 용도로 사용합니다.
 */
export async function fetchAdminCampaignCounts(supabase: SupabaseClient): Promise<CampaignCounts> {
    const today = new Date().toISOString().split('T')[0];

    try {
        const [pendingRes, recruitingRes, completedRes, draftRes] = await Promise.all([
            // 요청중 (PENDING)
            supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),

            // RECRUITING 및 ONGOING 상태 (날짜 필터링용)
            supabase.from('campaigns').select('id, recruitment_start_date, created_at, status')
                .in('status', ['RECRUITING', 'ONGOING']),

            // 완료 (COMPLETED)
            supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),

            // 임시저장 (DRAFT)
            supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT')
        ]);

        const recruitingCampaigns = recruitingRes.data || [];
        let upcomingCount = 0;
        let activeCount = 0;

        recruitingCampaigns.forEach(cam => {
            if (cam.status === 'ONGOING') {
                activeCount++;
                return;
            }

            if (cam.status === 'RECRUITING') {
                const startDateStr = cam.recruitment_start_date || cam.created_at;
                const startDate = startDateStr.split('T')[0];

                if (startDate > today) {
                    upcomingCount++;
                } else {
                    activeCount++;
                }
            }
        });

        return {
            pending: pendingRes.count || 0,
            upcoming: upcomingCount,
            active: activeCount,
            completed: completedRes.count || 0,
            draft: draftRes.count || 0
        };
    } catch (error) {
        console.error('Error fetching admin campaign counts:', error);
        return {
            pending: 0,
            upcoming: 0,
            active: 0,
            completed: 0,
            draft: 0
        };
    }
}
