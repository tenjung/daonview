import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { sendInfluencerSelectedAlimtalk } from '@/lib/alimtalk';

interface SendSelectionNotificationParams {
  userId: string;
  campaignId: number;
  campaignTitle: string;
  providedItems: string;
  deadlineDate: string;
  assignedOptionLabel?: string | null;
  assignedPurchaseLink?: string | null;
}

interface SendSelectionNotificationResult {
  success: boolean;
  errors: string[];
}

export async function sendSelectionNotification(
  params: SendSelectionNotificationParams
): Promise<SendSelectionNotificationResult> {
  const admin = createAdminClient();
  const errors: string[] = [];

  const { data: userProfile, error: profileError } = await admin
    .from('profiles')
    .select('id, phone_number, name, nickname, email')
    .eq('id', params.userId)
    .maybeSingle();

  if (profileError || !userProfile) {
    return {
      success: false,
      errors: ['수신자 프로필 조회 실패'],
    };
  }

  const recipientName = userProfile.nickname || userProfile.name || '인플루언서';
  const assignedOptionLabel = params.assignedOptionLabel || undefined;
  const assignedPurchaseLink = params.assignedPurchaseLink || undefined;

  if (userProfile.phone_number) {
    const talkResult = await sendInfluencerSelectedAlimtalk(
      userProfile.phone_number,
      recipientName,
      params.campaignTitle,
      params.campaignId,
      {
        assignedOptionLabel,
        assignedPurchaseLink,
      }
    );

    if (!talkResult.success) {
      errors.push(`카카오 알림톡 실패: ${talkResult.error || 'unknown error'}`);
    }
  } else {
    errors.push('카카오 알림톡 스킵: 전화번호 없음');
  }

  if (userProfile.email) {
    try {
      const emailResult = await sendEmail(userProfile.email, 'CAMPAIGN_SELECTED', {
        nickname: recipientName,
        campaignTitle: params.campaignTitle,
        providedItems: params.providedItems,
        deadlineDate: params.deadlineDate,
        assignedOptionLabel,
        assignedPurchaseLink,
      });

      if (!emailResult.success) {
        errors.push(`이메일 실패: ${emailResult.message || 'unknown error'}`);
      }
    } catch (error) {
      console.error('Selection email send error:', error);
      errors.push('이메일 실패: unexpected error');
    }
  } else {
    errors.push('이메일 스킵: 이메일 주소 없음');
  }

  if (errors.length > 0) {
    console.warn('Selection notification warnings:', {
      campaignId: params.campaignId,
      userId: params.userId,
      errors,
    });
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

