import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { ALIMTALK_PAUSED, sendInfluencerSelectedAlimtalk } from '@/lib/alimtalk';
import { normalizePurchaseLinkUrl } from '@/lib/purchaseLink';
import { getCampaignGuideContent } from '@/lib/campaignEmailContent';

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
  assigned_option_label?: string | null;
  assigned_purchase_link_url?: string | null;
  assigned_purchase_links?: Array<{ optionLabel: string; url: string }> | null;
}

export function getSelectionCampaignOptions(raw: unknown): SelectionCampaignOptions | null {
  return (Array.isArray(raw) ? raw[0] : raw) as SelectionCampaignOptions | null;
}

export async function notifySelectedApplication(
  campaign: SelectionCampaign,
  userId: string,
  application: SelectionApplication,
): Promise<SendSelectionNotificationResult> {
  const options = getSelectionCampaignOptions(campaign.campaign_options);
  const individual = Boolean(options?.step1Data?.productUrlIndividual);
  const assignedPurchases = individual && Array.isArray(application.assigned_purchase_links)
    ? application.assigned_purchase_links
      .map((item) => ({ optionLabel: item?.optionLabel, url: normalizePurchaseLinkUrl(item?.url) }))
      .filter((item) => item.optionLabel && item.url)
    : [];
  const assignedPurchaseLink = individual
    ? normalizePurchaseLinkUrl(application.assigned_purchase_link_url)
    : '';
  if (individual && (
    (application.assigned_purchase_links?.length && assignedPurchases.length !== application.assigned_purchase_links.length) ||
    (!assignedPurchases.length && !assignedPurchaseLink)
  )) {
    return { success: false, errors: ['배정된 구매링크를 확인할 수 없습니다.'] };
  }

  const deadline = new Date(campaign.end_date || '');
  const deadlineDate = Number.isNaN(deadline.getTime()) ? '캠페인 상세 페이지 참조' : new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(deadline);
  const { purchaseNotes, guideSummary } = getCampaignGuideContent(campaign.campaign_options);

  try {
    return await sendSelectionNotification({
      userId,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      providedItems: campaign.experience_details || campaign.product_name || '캠페인 상세 페이지 참조',
      deadlineDate,
      assignedOptionLabel: application.assigned_option_label,
      assignedPurchaseLink,
      assignedPurchases,
      commonPurchaseLink: individual ? undefined : normalizePurchaseLinkUrl(options?.step1Data?.productUrl),
      campaignUrl: `https://daonview.com/campaigns/${campaign.id}#guide`,
      purchaseNotes,
      guideSummary,
    });
  } catch (error) {
    console.error('Selection notification failed:', { campaignId: campaign.id, error });
    return { success: false, errors: ['선정 알림 발송에 실패했습니다.'] };
  }
}

interface SendSelectionNotificationParams {
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

  if (!ALIMTALK_PAUSED && userProfile.phone_number) {
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
  } else if (!ALIMTALK_PAUSED) {
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
        campaignUrl: params.campaignUrl,
        purchaseNotes: params.purchaseNotes,
        guideSummary: params.guideSummary,
        assignedPurchases: params.assignedPurchases,
        commonPurchaseLink: params.commonPurchaseLink,
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
