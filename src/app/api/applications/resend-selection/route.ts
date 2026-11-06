import { NextResponse } from 'next/server';
import { notifySelectedApplication, type SelectionApplication, type SelectionCampaign } from '@/lib/applicationSelectionNotification';
import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface ResendApplication extends SelectionApplication {
  user_id: string;
  status: string;
  campaign: (SelectionCampaign & { created_by: string }) | null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const applicationId = body?.applicationId;
    if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
      return NextResponse.json({ error: '유효하지 않은 신청 ID입니다.' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile) {
      return NextResponse.json({ error: '사용자 권한을 확인할 수 없습니다.' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: application, error: applicationError } = await admin
      .from('applications')
      .select('user_id, status, assigned_option_label, assigned_purchase_link_url, assigned_purchase_links, campaign:campaign_id(id, title, created_by, end_date, experience_details, product_name, campaign_options)')
      .eq('id', applicationId)
      .maybeSingle()
      .overrideTypes<ResendApplication, { merge: false }>();
    const campaign = application?.campaign;
    if (applicationError) throw applicationError;
    if (!application || !campaign) {
      return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (!isAdminRole(normalizeRoleValue(profile.role)) && campaign.created_by !== user.id) {
      return NextResponse.json({ error: '선정 알림을 재발송할 권한이 없습니다.' }, { status: 403 });
    }
    if (!['SELECTED', 'APPROVED'].includes(String(application.status || '').toUpperCase())) {
      return NextResponse.json({ error: '선정 또는 승인된 신청만 재발송할 수 있습니다.' }, { status: 409 });
    }

    const notification = await notifySelectedApplication(campaign, application.user_id, application);
    return NextResponse.json(notification, { status: notification.success ? 200 : 502 });
  } catch (error) {
    console.error('Selection resend API error:', error);
    return NextResponse.json({ error: '선정 알림 재발송에 실패했습니다.' }, { status: 500 });
  }
}
