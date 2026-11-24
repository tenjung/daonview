import { normalizePurchaseLinkUrl } from '@/lib/purchaseLink';
import { getCampaignGuideContent } from '@/lib/campaignEmailContent';

/** 선정 메일과 선정 알림톡이 같은 정보를 쓰도록 하는 공통 구성. 서버 SDK를 import하지 않는다. */
export interface SelectionContentCampaign {
  id: number;
  title: string;
  end_date?: string | null;
  experience_details?: string | null;
  product_name?: string | null;
  campaign_options: unknown;
}
export interface SelectionContentApplication {
  assigned_option_label?: string | null;
  assigned_purchase_link_url?: string | null;
  assigned_purchase_links?: Array<{ optionLabel: string; url: string }> | null;
}
export interface SelectionContent {
  providedItems: string;
  deadlineDate: string;
  assignedOptionLabel?: string;
  assignedPurchaseLink?: string;
  assignedPurchases: Array<{ optionLabel: string; url: string }>;
  commonPurchaseLink?: string;
  purchaseNotes: string;
  guideSummary: string;
  campaignUrl: string;
}
interface CampaignStep1 { productUrlIndividual?: boolean; productUrl?: string }

export function buildSelectionContent(
  campaign: SelectionContentCampaign,
  application: SelectionContentApplication,
): { ok: true; content: SelectionContent } | { ok: false; error: string } {
  const root = Array.isArray(campaign.campaign_options) ? campaign.campaign_options[0] : campaign.campaign_options;
  const step1 = ((root as { step1Data?: CampaignStep1 } | null)?.step1Data) || {};
  const individual = Boolean(step1.productUrlIndividual);
  const assignedPurchases = individual && Array.isArray(application.assigned_purchase_links)
    ? application.assigned_purchase_links
      .map((item) => ({ optionLabel: item?.optionLabel, url: normalizePurchaseLinkUrl(item?.url) }))
      .filter((item): item is { optionLabel: string; url: string } => Boolean(item.optionLabel && item.url))
    : [];
  const assignedPurchaseLink = individual ? normalizePurchaseLinkUrl(application.assigned_purchase_link_url) : '';
  if (individual && (
    (application.assigned_purchase_links?.length && assignedPurchases.length !== application.assigned_purchase_links.length) ||
    (!assignedPurchases.length && !assignedPurchaseLink)
  )) {
    return { ok: false, error: '배정된 구매링크를 확인할 수 없습니다.' };
  }

  const deadline = new Date(campaign.end_date || '');
  const deadlineDate = Number.isNaN(deadline.getTime()) ? '캠페인 상세 페이지 참조' : new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(deadline);
  const { purchaseNotes, guideSummary } = getCampaignGuideContent(campaign.campaign_options);

  return {
    ok: true,
    content: {
      providedItems: campaign.experience_details || campaign.product_name || '캠페인 상세 페이지 참조',
      deadlineDate,
      assignedOptionLabel: application.assigned_option_label || undefined,
      assignedPurchaseLink: assignedPurchaseLink || undefined,
      assignedPurchases,
      commonPurchaseLink: individual ? undefined : normalizePurchaseLinkUrl(step1.productUrl) || undefined,
      purchaseNotes,
      guideSummary,
      campaignUrl: `https://daonview.com/campaigns/${campaign.id}#guide`,
    },
  };
}
