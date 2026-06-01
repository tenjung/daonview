import { Campaign, CampaignImageVariant } from '@/types/database';
import { buildCampaignSchedule, CampaignScheduleType, formatKstDate, normalizeScheduleType } from './campaignSchedule';

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

type CampaignLikeRecord = Partial<Campaign> & Record<string, any>;

export interface CampaignStep1Like {
  campaignType?: unknown;
  platform?: unknown;
  includeReview?: unknown;
  includeNaver?: unknown;
  includeInstagram?: unknown;
  recruitmentStartDate?: unknown;
  scheduleType?: unknown;
  totalRecruitment?: unknown;
}

export interface CampaignStep1SnapshotInput extends CampaignStep1Like {
  productUrl?: string;
  productUrlPrivate?: boolean;
  productUrlIndividual?: boolean;
  purchaseLinkPools?: unknown[];
  productName?: string;
  campaignTitle?: string;
  brandName?: string;
  brandId?: string | null;
  productOptions?: unknown[];
  productPrice?: string;
  shippingCost?: string;
  isCouponRequired?: boolean;
  purchaseRewardMethod?: 'DIRECT' | 'DAONVIEW' | null;
  category?: string;
  region?: string;
  subRegion?: string;
  stores?: unknown[];
  contactPhone?: string;
  contactMethod?: string;
  advertiserWillContact?: boolean;
  visitTime?: string;
  visitTimeNegotiable?: boolean;
  visitDays?: string[];
  visitNotes?: string;
  experienceDetails?: string;
  officialPrice?: string;
  reviewDeadlineDays?: string;
  optionConfig?: {
    mode: 'SINGLE' | 'RANKED' | 'MULTI';
    maxSelect: number;
  };
}

export interface CampaignCanonicalState extends CampaignPlatformState {
  canonicalType: 'DELIVERY' | 'VISIT' | 'PRESS';
  canonicalPlatform: 'BLOG' | 'INSTAGRAM' | 'PURCHASE';
  scheduleType: CampaignScheduleType;
  recruitmentStartDate: string;
  firstSelectionDate: string;
  reviewDeadline: string;
  endDate: string | null;
  isUnlimitedRecruitment: boolean;
  totalRecruitmentText: string;
  totalRecruitmentValue: number | null;
}

export interface CampaignHydrationState extends CampaignCanonicalState {
  options: Record<string, any>;
  step1Data: Record<string, any>;
  step2Data: Record<string, any>;
  step3Data: Record<string, any>;
  currentStep: number;
}

export function getCampaignOptions(campaign: CampaignLikeRecord | null | undefined) {
  const optionsRaw = campaign?.campaign_options;
  if (Array.isArray(optionsRaw)) {
    return (optionsRaw[0] || {}) as Record<string, any>;
  }

  return (optionsRaw || {}) as Record<string, any>;
}

const isNonEmptyString = (value: unknown): value is string => (
  typeof value === 'string' && value.trim().length > 0
);

export function normalizeCampaignImageVariants(rawValue: unknown): CampaignImageVariant[] {
  if (!Array.isArray(rawValue)) return [];

  return rawValue
    .map((item): CampaignImageVariant | null => {
      if (typeof item === 'string' && item.trim()) {
        return {
          originalPath: null,
          thumbnailUrl: item,
          mediumUrl: item,
        };
      }

      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const thumbnailUrl = record.thumbnailUrl || record.thumbnail_url || record.thumbUrl || record.thumb_url;
      const mediumUrl = record.mediumUrl || record.medium_url || record.displayUrl || record.display_url || thumbnailUrl;

      if (!isNonEmptyString(thumbnailUrl) || !isNonEmptyString(mediumUrl)) return null;

      return {
        originalPath: isNonEmptyString(record.originalPath || record.original_path)
          ? String(record.originalPath || record.original_path)
          : null,
        thumbnailUrl,
        mediumUrl,
        width: typeof record.width === 'number' ? record.width : null,
        height: typeof record.height === 'number' ? record.height : null,
        originalSize: typeof record.originalSize === 'number' ? record.originalSize : typeof record.original_size === 'number' ? record.original_size : null,
        thumbnailSize: typeof record.thumbnailSize === 'number' ? record.thumbnailSize : typeof record.thumbnail_size === 'number' ? record.thumbnail_size : null,
        mediumSize: typeof record.mediumSize === 'number' ? record.mediumSize : typeof record.medium_size === 'number' ? record.medium_size : null,
      };
    })
    .filter((item): item is CampaignImageVariant => Boolean(item));
}

export function resolveCampaignImageVariants(campaign: CampaignLikeRecord | null | undefined): CampaignImageVariant[] {
  if (!campaign) return [];
  const options = getCampaignOptions(campaign);
  const step2Data = (options.step2Data || {}) as Record<string, unknown>;
  const normalizedVariants = [
    ...normalizeCampaignImageVariants(campaign.campaign_image_variants),
    ...normalizeCampaignImageVariants(step2Data.campaignImageVariants),
  ];

  if (normalizedVariants.length > 0) {
    const seen = new Set<string>();
    return normalizedVariants.filter((variant) => {
      const key = `${variant.thumbnailUrl}|${variant.mediumUrl}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const imageSet = new Set<string>();
  if (isNonEmptyString(campaign.thumbnail_url)) imageSet.add(campaign.thumbnail_url);
  if (isNonEmptyString(campaign.sub_image_1)) imageSet.add(campaign.sub_image_1);
  if (isNonEmptyString(campaign.sub_image_2)) imageSet.add(campaign.sub_image_2);
  if (Array.isArray(campaign.campaign_images)) {
    campaign.campaign_images.forEach((image) => {
      if (isNonEmptyString(image)) imageSet.add(image);
    });
  }
  if (Array.isArray(step2Data.campaignImages)) {
    step2Data.campaignImages.forEach((image) => {
      if (isNonEmptyString(image)) imageSet.add(image);
    });
  }

  return Array.from(imageSet).map((url) => ({
    originalPath: null,
    thumbnailUrl: url,
    mediumUrl: url,
  }));
}

export function getCampaignScheduleType(campaign: CampaignLikeRecord | null | undefined): CampaignScheduleType {
  const options = getCampaignOptions(campaign);
  const step1Data = (options.step1Data || {}) as Record<string, any>;

  return normalizeScheduleType(
    step1Data.scheduleType ||
    campaign?.schedule_type ||
    campaign?.campaign_schedule_type
  );
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

export function deriveCampaignCanonicalState(input: {
  type?: unknown;
  platform?: unknown;
  step1Data?: CampaignStep1Like | null;
  baseDate?: string;
  isUnlimitedRecruitment?: unknown;
  totalRecruitment?: unknown;
}) : CampaignCanonicalState {
  const step1Data = input.step1Data || {};
  const platformState = resolveCampaignPlatformState({
    type: input.type,
    platform: input.platform,
    step1Data,
  });

  const canonicalType = platformState.normalizedType === 'DELIVERY'
    ? 'DELIVERY'
    : platformState.normalizedType === 'PRESS'
      ? 'PRESS'
      : 'VISIT';
  const canonicalPlatform = platformState.resolvedPlatform === 'INSTAGRAM'
    ? 'INSTAGRAM'
    : platformState.resolvedPlatform === 'BLOG'
      ? 'BLOG'
      : 'PURCHASE';
  const requestedScheduleType = normalizeScheduleType(step1Data.scheduleType);
  const scheduleBaseDate = String(
    step1Data.recruitmentStartDate ||
    input.baseDate ||
    formatKstDate()
  );
  const schedule = buildCampaignSchedule(requestedScheduleType, scheduleBaseDate);
  const totalRecruitmentTextRaw = String(
    step1Data.totalRecruitment ??
    input.totalRecruitment ??
    '0'
  );
  const isUnlimitedRecruitment = Boolean(input.isUnlimitedRecruitment)
    || totalRecruitmentTextRaw === '무제한'
    || totalRecruitmentTextRaw === '999';
  const totalRecruitmentValue = isUnlimitedRecruitment
    ? null
    : (parseInt(totalRecruitmentTextRaw, 10) || 0);

  return {
    ...platformState,
    canonicalType,
    canonicalPlatform,
    scheduleType: schedule.scheduleType,
    recruitmentStartDate: schedule.recruitmentStartDate,
    firstSelectionDate: schedule.firstSelectionDate,
    reviewDeadline: schedule.reviewDeadline,
    endDate: schedule.reviewDeadline,
    isUnlimitedRecruitment,
    totalRecruitmentText: isUnlimitedRecruitment ? '999' : String(totalRecruitmentValue ?? 0),
    totalRecruitmentValue,
  };
}

export function deriveCampaignHydrationState(campaign: CampaignLikeRecord): CampaignHydrationState {
  const options = getCampaignOptions(campaign);
  const step1Data = (options.step1Data || {}) as Record<string, any>;
  const step2Data = (options.step2Data || {}) as Record<string, any>;
  const step3Data = (options.step3Data || {}) as Record<string, any>;
  const canonical = deriveCampaignCanonicalState({
    type: campaign.type,
    platform: campaign.platform,
    step1Data,
    baseDate: String(
      campaign.recruitment_start_date || step1Data.recruitmentStartDate || formatKstDate()
    ),
    isUnlimitedRecruitment: campaign.is_unlimited_recruitment,
    totalRecruitment: campaign.total_recruitment ?? step1Data.totalRecruitment,
  });
  const hasCanonicalDates =
    Boolean(campaign.recruitment_start_date) &&
    Boolean(campaign.end_date);

  return {
    ...canonical,
    recruitmentStartDate: hasCanonicalDates
      ? String(campaign.recruitment_start_date)
      : canonical.recruitmentStartDate,
    firstSelectionDate: hasCanonicalDates
      ? String(campaign.first_selection_date || canonical.firstSelectionDate)
      : canonical.firstSelectionDate,
    reviewDeadline: hasCanonicalDates
      ? String(campaign.end_date)
      : canonical.reviewDeadline,
    endDate: hasCanonicalDates ? String(campaign.end_date) : canonical.endDate,
    options,
    step1Data,
    step2Data,
    step3Data,
    currentStep: Number(options.currentStep || 1),
  };
}

export function buildCampaignStep1Snapshot(input: CampaignStep1SnapshotInput) {
  const canonical = deriveCampaignCanonicalState({
    type: input.campaignType,
    platform: input.platform,
    step1Data: input,
    baseDate: String(input.recruitmentStartDate || ''),
  });

  return {
    canonical,
    step1Data: {
      includeReview: canonical.includeReview,
      includeNaver: canonical.includeNaver,
      includeInstagram: canonical.includeInstagram,
      productUrl: input.productUrl || '',
      productUrlPrivate: Boolean(input.productUrlPrivate),
      productUrlIndividual: Boolean(input.productUrlIndividual),
      purchaseLinkPools: Array.isArray(input.purchaseLinkPools) ? input.purchaseLinkPools : [],
      productName: input.productName || '',
      campaignTitle: input.campaignTitle || '',
      brandName: input.brandName || '',
      brandId: input.brandId || null,
      productOptions: Array.isArray(input.productOptions) ? input.productOptions : [],
      productPrice: input.productPrice || '0',
      shippingCost: input.shippingCost || '0',
      isCouponRequired: Boolean(input.isCouponRequired),
      purchaseRewardMethod: input.purchaseRewardMethod || null,
      category: input.category || '',
      region: input.region || '',
      subRegion: input.subRegion || '',
      stores: Array.isArray(input.stores) ? input.stores : [],
      contactPhone: input.contactPhone || '',
      contactMethod: input.contactMethod || 'TEXT_ONLY',
      advertiserWillContact: Boolean(input.advertiserWillContact),
      visitTime: input.visitTime || '',
      visitTimeNegotiable: Boolean(input.visitTimeNegotiable),
      visitDays: Array.isArray(input.visitDays) ? input.visitDays : [],
      visitNotes: input.visitNotes || '',
      experienceDetails: input.experienceDetails || '',
      officialPrice: input.officialPrice || '',
      scheduleType: canonical.scheduleType,
      reviewDeadlineDays: input.reviewDeadlineDays || '7',
      optionConfig: input.optionConfig || { mode: 'SINGLE', maxSelect: 1 },
    },
  };
}

export const formatDDay = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "종료";
  if (diffDays === 0) return "D-0";
  return `D-${diffDays}`;
};

export const isCampaignAutoExtendEnabled = (campaign: Partial<Campaign> | Record<string, any> | null | undefined) => {
  return getCampaignScheduleType(campaign as CampaignLikeRecord) === 'FAST';
};

export const isCampaignFastRecruitment = (campaign: Partial<Campaign> | Record<string, any> | null | undefined) => {
  return getCampaignScheduleType(campaign as CampaignLikeRecord) === 'FAST';
};

export const isCampaignUnlimitedRecruitment = (campaign: Partial<Campaign> | Record<string, any> | null | undefined) => {
  return Boolean(campaign?.is_unlimited_recruitment);
};

export const getCampaignRecruitTarget = (campaign: Partial<Campaign> | Record<string, any> | null | undefined) => {
  if (!campaign || isCampaignUnlimitedRecruitment(campaign)) return null;

  if (typeof campaign.total_recruitment === 'number') return campaign.total_recruitment;
  return null;
};

export const resolveCampaignScheduleDates = (campaign: CampaignLikeRecord) => {
  const step1Data = getCampaignOptions(campaign)?.step1Data || {};

  const startDate = (campaign as any).recruitment_start_date || step1Data.recruitmentStartDate || campaign.created_at || null;
  const endDate = (campaign as any).end_date || step1Data.reviewDeadline || null;
  const firstSelectionDate = (campaign as any).first_selection_date || step1Data.firstSelectionDate || null;

  return {
    startDate,
    endDate,
    firstSelectionDate,
  };
};

export const mapCampaignToCard = (campaign: Campaign & { applications?: { count: number }[] | { count: number } | number }) => {
  // Handle Supabase count response
  let applicants = 0;
  if (Array.isArray(campaign.applications)) {
    applicants = campaign.applications[0]?.count || 0;
  } else if (typeof campaign.applications === 'object' && campaign.applications !== null) {
    // @ts-ignore
    applicants = campaign.applications.count || 0;
  }

  // 캠페인 옵션에서 데이터 추출 시도 (임시저장 데이터 대응)
  const options = getCampaignOptions(campaign as CampaignLikeRecord);
  const provision = campaign.provision || (campaign as any).experience_details || options?.step1Data?.experienceDetails || '';
  const productName = (campaign as any).product_name || options?.step1Data?.productName || campaign.title;

  const hydration = deriveCampaignHydrationState(campaign as CampaignLikeRecord);
  const { endDate } = resolveCampaignScheduleDates(campaign);
  const rawRegion = (campaign as any).region ?? hydration.step1Data.region ?? null;
  const rawSubRegion = (campaign as any).sub_region ?? hydration.step1Data.subRegion ?? null;
  const recruitTarget = getCampaignRecruitTarget(campaign);
  const scheduleType = getCampaignScheduleType(campaign);
  const isUnlimitedRecruitment = isCampaignUnlimitedRecruitment(campaign);
  const isFastRecruitment = scheduleType === 'FAST';
  const imageVariants = resolveCampaignImageVariants(campaign as CampaignLikeRecord);

  return {
    id: campaign.id,
    title: campaign.title || productName,
    platform: hydration.canonicalPlatform,
    type: hydration.canonicalType,
    applicants: applicants,
    total: recruitTarget || 0,
    dday: isFastRecruitment ? '상시' : endDate ? formatDDay(endDate) : '미정',
    category: campaign.category,
    region: rawRegion ? String(rawRegion) : null,
    sub_region: rawSubRegion ? String(rawSubRegion) : null,
    imageUrl: imageVariants[0]?.thumbnailUrl || campaign.thumbnail_url || '',
    provision: provision,
    end_date: endDate,
    is_unlimited_recruitment: isUnlimitedRecruitment,
    created_at: campaign.created_at,
    scheduleType,
    includeReview: hydration.includeReview,
    includeNaver: hydration.includeNaver,
    includeInstagram: hydration.includeInstagram,
  };
};
