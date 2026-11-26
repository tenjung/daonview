import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { buildSelectionContent, type SelectionContent } from '@/lib/selectionContent';
import { trackSelectionEmail } from '@/lib/selectionEmailDelivery';

export interface SelectionCampaignOptions {
  step1Data?: {
    productUrlIndividual?: boolean;
    productUrl?: string;
    productName?: string;
  };
  step2Data?: {
    reviewMissionContent?: string;
    purchaseNotes?: string;
    missionGuide?: string;
  };
}

export interface SelectionCampaign {
  id: number;
  title: string;
  end_date?: string | null;
  experience_details?: string | null;
  product_name?: string | null;
  campaign_options: unknown;
}

export interface SelectionApplication {
  id: number;
  assigned_option_label?: string | null;
  assigned_purchase_link_url?: string | null;
  assigned_purchase_links?: Array<{ optionLabel: string; url: string }> | null;
}

export function getSelectionCampaignOptions(raw: unknown): SelectionCampaignOptions | null {
  return (Array.isArray(raw) ? raw[0] : raw) as SelectionCampaignOptions | null;
}

/** 선정 메일 발송·미리보기가 같은 값을 쓰도록 공통 콘텐츠를 발송 파라미터로 바꾼다. */
export function toSelectionNotificationParams(
  campaign: SelectionCampaign, userId: string, applicationId: number, content: SelectionContent,
): SendSelectionNotificationParams {
  return {
    applicationId,
    userId,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    providedItems: content.providedItems,
    deadlineDate: content.deadlineDate,
    assignedOptionLabel: content.assignedOptionLabel,
    assignedPurchaseLink: content.assignedPurchaseLink,
    assignedPurchases: content.assignedPurchases,
    commonPurchaseLink: content.commonPurchaseLink,
    campaignUrl: content.campaignUrl,
    purchaseNotes: content.purchaseNotes,
    guideSummary: content.guideSummary,
  };
}

/** sendEmail('CAMPAIGN_SELECTED')에 넘기는 값. 미리보기 HTML도 이 값으로 만든다. */
export function toSelectionEmailParams(params: SendSelectionNotificationParams, recipientName: string) {
  return {
    nickname: recipientName,
    campaignTitle: params.campaignTitle,
    providedItems: params.providedItems,
    deadlineDate: params.deadlineDate,
    assignedOptionLabel: params.assignedOptionLabel || undefined,
    assignedPurchaseLink: params.assignedPurchaseLink || undefined,
    campaignUrl: params.campaignUrl,
    purchaseNotes: params.purchaseNotes,
    guideSummary: params.guideSummary,
    assignedPurchases: params.assignedPurchases,
    commonPurchaseLink: params.commonPurchaseLink,
  };
}

export async function notifySelectedApplication(
  campaign: SelectionCampaign,
  userId: string,
  application: SelectionApplication,
): Promise<SendSelectionNotificationResult> {
  const built = buildSelectionContent(campaign, application);
  if (!built.ok) return { success: false, errors: [built.error] };
  const content = built.content;

  try {
    return await sendSelectionNotification(toSelectionNotificationParams(campaign, userId, application.id, content));
  } catch (error) {
    console.error('Selection notification failed:', { campaignId: campaign.id, error });
    return { success: false, errors: ['선정 알림 발송에 실패했습니다.'] };
  }
}

export interface SendSelectionNotificationParams {
  applicationId: number;
  userId: string;
  campaignId: number;
  campaignTitle: string;
  providedItems: string;
  deadlineDate: string;
  assignedOptionLabel?: string | null;
  assignedPurchaseLink?: string | null;
  assignedPurchases?: Array<{ optionLabel: string; url: string }>;
  commonPurchaseLink?: string;
  campaignUrl: string;
  purchaseNotes?: string;
  guideSummary: string;
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
    .select('id, name, nickname, email')
    .eq('id', params.userId)
    .maybeSingle();

  if (profileError || !userProfile) {
    return {
      success: false,
      errors: ['수신자 프로필 조회 실패'],
    };
  }

  const recipientName = userProfile.nickname || userProfile.name || '인플루언서';

  // 카카오 알림톡은 자동 발송하지 않는다. 메일 반송 보류 건만 관리자가 수동 발송(selectionKakaoServer).
  if (userProfile.email) {
    try {
      const emailResult = await trackSelectionEmail(params.applicationId, userProfile.email,
        () => sendEmail(userProfile.email!, 'CAMPAIGN_SELECTED', toSelectionEmailParams(params, recipientName)));

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
