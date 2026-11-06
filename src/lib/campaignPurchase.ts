import { normalizeCampaignPlatform, normalizeCampaignType } from './campaignUtils';

type CampaignPurchaseSource = {
  type?: string | null;
  platform?: string | null;
  campaign_options?: unknown;
};

export type CampaignReviewMode = 'PURCHASE' | 'NAVER_BLOG' | 'LINK';

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

export function getCampaignReviewMode(campaign?: CampaignPurchaseSource | null): CampaignReviewMode {
  if (isPurchaseReviewCampaign(campaign)) return 'PURCHASE';
  const step1 = getStep1Data(campaign?.campaign_options);
  if (normalizeCampaignType(campaign?.type || step1.campaignType) !== 'DELIVERY') return 'LINK';

  const platforms = String(campaign?.platform || step1.platform || '')
    .split(/[,+/\s]+/)
    .map((platform) => normalizeCampaignPlatform(platform, 'OTHER'));
  const includesInstagram = platforms.includes('INSTAGRAM') || step1.includeInstagram === true;
  if (!includesInstagram && (platforms.includes('BLOG') || step1.includeNaver === true)) return 'NAVER_BLOG';
  return 'LINK';
}

export function isNaverBlogPostUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    if (!['blog.naver.com', 'm.blog.naver.com'].includes(url.hostname)) return false;
    if (/^\/[^/]+\/\d+\/?$/.test(url.pathname)) return true;
    return url.pathname.toLowerCase() === '/postview.naver'
      && Boolean(url.searchParams.get('blogId'))
      && /^\d+$/.test(url.searchParams.get('logNo') || '');
  } catch {
    return false;
  }
}

