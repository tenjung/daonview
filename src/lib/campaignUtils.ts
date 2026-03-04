import { Campaign } from '@/types/database';

export type NormalizedCampaignType = 'DELIVERY' | 'VISIT' | 'PRESS' | 'PURCHASE';
export type NormalizedPlatform = 'BLOG' | 'INSTAGRAM' | 'PURCHASE' | 'OTHER';

export function normalizeCampaignType(rawType: unknown): NormalizedCampaignType {
  const value = String(rawType || '').toUpperCase();
  if (value === 'DELIVERY' || value === '배송형') return 'DELIVERY';
  if (value === 'PRESS' || value === '기자단') return 'PRESS';
  if (value === 'PURCHASE' || value === '구매평') return 'PURCHASE';
  return 'VISIT';
}

export function normalizeCampaignPlatform(rawPlatform: unknown, fallback: NormalizedPlatform = 'BLOG'): NormalizedPlatform {
  const value = String(rawPlatform || '').toUpperCase();
  if (value === 'BLOG' || value === 'NAVER_BLOG' || value === '블로그') return 'BLOG';
  if (value === 'INSTAGRAM' || value === '인스타' || value === '인스타그램') return 'INSTAGRAM';
  if (value === 'PURCHASE' || value === '구매평') return 'PURCHASE';
  if (value === 'OTHER' || value === '기타') return 'OTHER';
  return fallback;
}

export interface CampaignPlatformState {
  normalizedType: NormalizedCampaignType;
  resolvedPlatform: NormalizedPlatform;
  includeReview: boolean;
  includeNaver: boolean;
  includeInstagram: boolean;
}

export function resolveCampaignPlatformState(input: {
  type?: unknown;
  platform?: unknown;
  step1Data?: {
    campaignType?: unknown;
    platform?: unknown;
    includeReview?: unknown;
    includeNaver?: unknown;
    includeInstagram?: unknown;
  } | null;
}): CampaignPlatformState {
  const step1Data = input.step1Data || {};
  const normalizedType = normalizeCampaignType(input.type || step1Data.campaignType || 'VISIT');
  const defaultPlatformByType: NormalizedPlatform = normalizedType === 'DELIVERY' ? 'PURCHASE' : 'BLOG';
  const normalizedTopPlatform = normalizeCampaignPlatform(
    input.platform || step1Data.platform || defaultPlatformByType,
    defaultPlatformByType
  );

  let includeReview = Boolean(step1Data.includeReview);
  let includeNaver = Boolean(step1Data.includeNaver);
  let includeInstagram = Boolean(step1Data.includeInstagram);
  const hasIncludeFlagKeys =
    Object.prototype.hasOwnProperty.call(step1Data, 'includeReview') ||
    Object.prototype.hasOwnProperty.call(step1Data, 'includeNaver') ||
    Object.prototype.hasOwnProperty.call(step1Data, 'includeInstagram');

  if (normalizedType === 'DELIVERY') {
    if (!hasIncludeFlagKeys || (!includeReview && !includeNaver && !includeInstagram)) {
      includeReview = normalizedTopPlatform === 'PURCHASE';
      includeNaver = normalizedTopPlatform === 'BLOG';
      includeInstagram = normalizedTopPlatform === 'INSTAGRAM';
    }

    // DELIVERY: NAVER and INSTAGRAM must be mutually exclusive.
    if (includeNaver && includeInstagram) {
      if (normalizedTopPlatform === 'INSTAGRAM') includeNaver = false;
      else includeInstagram = false;
    }
  } else {
    includeReview = false;
    // VISIT/PRESS: exactly one platform is selected (BLOG fallback).
    includeNaver = normalizedTopPlatform !== 'INSTAGRAM';
    includeInstagram = normalizedTopPlatform === 'INSTAGRAM';
  }

  const resolvedPlatform: NormalizedPlatform =
    normalizedType === 'DELIVERY'
      ? (includeNaver ? 'BLOG' : includeInstagram ? 'INSTAGRAM' : 'PURCHASE')
      : (includeNaver ? 'BLOG' : includeInstagram ? 'INSTAGRAM' : normalizedTopPlatform);

  return {
    normalizedType,
    resolvedPlatform,
    includeReview,
    includeNaver,
    includeInstagram,
  };
}

export const formatDDay = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();

  // Handle 'Always' date (e.g. year 9999)
  if (end.getFullYear() > 2100) return "상시";

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "종료";
  if (diffDays === 0) return "D-0";
  return `D-${diffDays}`;
};

export const mapCampaignToCard = (campaign: Campaign & { applications?: { count: number }[] | { count: number } | number, is_always?: boolean }) => {
  // Handle Supabase count response
  let applicants = 0;
  if (Array.isArray(campaign.applications)) {
    applicants = campaign.applications[0]?.count || 0;
  } else if (typeof campaign.applications === 'object' && campaign.applications !== null) {
    // @ts-ignore
    applicants = campaign.applications.count || 0;
  }

  // 캠페인 옵션에서 데이터 추출 시도 (임시저장 데이터 대응)
  const options = Array.isArray((campaign as any).campaign_options) ? (campaign as any).campaign_options[0] : (campaign as any).campaign_options;
  const provision = campaign.provision || (campaign as any).experience_details || options?.step1Data?.experienceDetails || '';
  const productName = (campaign as any).product_name || options?.step1Data?.productName || campaign.title;

  const step1Data = options?.step1Data || {};
  const rawRegion = (campaign as any).region ?? step1Data.region ?? null;
  const rawSubRegion = (campaign as any).sub_region ?? step1Data.subRegion ?? null;
  const {
    normalizedType,
    resolvedPlatform,
    includeReview,
    includeNaver,
    includeInstagram,
  } = resolveCampaignPlatformState({
    type: campaign.type,
    platform: campaign.platform,
    step1Data,
  });

  return {
    id: campaign.id,
    title: campaign.title || productName,
    platform: resolvedPlatform,
    type: normalizedType,
    applicants: applicants,
    total: campaign.recruit_count || 0,
    dday: (campaign.is_always || (campaign.recruit_count && campaign.recruit_count >= 999)) ? "상시" : formatDDay(campaign.end_date),
    category: campaign.category,
    region: rawRegion ? String(rawRegion) : null,
    sub_region: rawSubRegion ? String(rawSubRegion) : null,
    imageUrl: campaign.thumbnail_url || '',
    provision: provision,
    end_date: campaign.end_date,
    created_at: campaign.created_at,
    includeReview,
    includeNaver,
    includeInstagram,
  };
};
