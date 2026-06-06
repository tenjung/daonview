import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/campaignPermissions';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: '사용자 권한 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (isAdminRole(profile?.role)) {
      const unlimitedQuota = { count: 0, limit: 0, unlimited: true };

      return NextResponse.json({
        analysis: unlimitedQuota,
        writing: unlimitedQuota,
        landing: unlimitedQuota,
        smartStoreTags: unlimitedQuota
      });
    }

    // 금일 사용 횟수 확인 (KST 기준)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const kstToday = kstDate.toISOString().split('T')[0];
    
    // 비동기 쿼리 헬퍼
    const getQuotaForTable = async (tableName: string, limit: number = 2) => {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', `${kstToday}T00:00:00+09:00`)
          .lt('created_at', `${kstToday}T23:59:59+09:00`);
        
        if (error) {
          console.warn(`[Quota API] ${tableName} 테이블 조회 실패 (테이블 미존재 가능성):`, error.message);
          return { count: 0, limit }; // 실패 시 0 처리 (추후 테이블 생성 시 정상작동)
        }
        return { count: count || 0, limit };
      } catch {
        return { count: 0, limit };
      }
    };

    const quotaAnalysis = await getQuotaForTable('ai_analysis_logs', 2);
    const quotaWriting = await getQuotaForTable('ai_writing_logs', 2);
    const quotaLanding = await getQuotaForTable('ai_landing_logs', 2);
    const quotaSmartStoreTags = await getQuotaForTable('ai_smart_store_tag_logs', 2);

    return NextResponse.json({
      analysis: quotaAnalysis,
      writing: quotaWriting,
      landing: quotaLanding,
      smartStoreTags: quotaSmartStoreTags
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
