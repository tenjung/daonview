type CampaignPurchaseSource = {
  type?: string | null;
  platform?: string | null;
  campaign_options?: unknown;
};

function getStep1Data(campaignOptions: unknown): Record<string, unknown> {
  const root = Array.isArray(campaignOptions) ? campaignOptions[0] : campaignOptions;
  if (!root || typeof root !== 'object') return {};

  const step1Data = (root as Record<string, unknown>).step1Data;
  return step1Data && typeof step1Data === 'object'
    ? step1Data as Record<string, unknown>
    : {};
}

export function isPurchaseReviewCampaign(campaign?: CampaignPurchaseSource | null): boolean {
  if (!campaign) return false;

  const normalizedType = String(campaign.type || '').toUpperCase();
  const normalizedPlatforms = String(campaign.platform || '')
    .toUpperCase()
    .split(/[,+/\s]+/)
    .filter(Boolean);
  const step1Data = getStep1Data(campaign.campaign_options);

  return normalizedType === 'PURCHASE'
    || normalizedPlatforms.includes('PURCHASE')
    || step1Data.includeReview === true;
}

