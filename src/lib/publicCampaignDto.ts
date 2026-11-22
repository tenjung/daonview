type Row = Record<string, unknown>;
const STEP1_PUBLIC_FIELDS = [
  'campaignType', 'platform', 'options', 'includeReview', 'includeNaver', 'includeInstagram', 'productUrl', 'productUrlPrivate',
  'productUrlIndividual', 'productName', 'campaignTitle', 'brandName', 'productOptions',
  'optionConfig', 'productPrice', 'shippingCost', 'isCouponRequired', 'purchaseRewardMethod',
  'category', 'region', 'subRegion', 'stores', 'contactPhone', 'contactMethod',
  'advertiserWillContact', 'visitTime', 'visitTimeNegotiable', 'visitDays', 'visitNotes',
  'experienceDetails', 'recruitCount', 'recruitmentCount', 'totalRecruitment',
  'recruitmentStartDate', 'firstSelectionDate', 'reviewDeadline', 'reviewDeadlineDays',
  'scheduleType', 'isUnlimitedRecruitment', 'officialPrice',
] as const;
const STEP2_PUBLIC_FIELDS = [
  'campaignTitle', 'reviewMissionContent', 'missionGuide', 'purchaseNotes', 'additionalNotes',
  'photoCount', 'textLength', 'videoRequired', 'keywords', 'campaignImages', 'campaignImageVariants',
  'blogMainKeyword', 'blogTitleGuide', 'blogMapRequired', 'blogSubKeywords', 'blogMainKeywords', 'blogRequiredLinks',
  'blogContentGuide', 'prohibitedWords', 'instagramHashtags', 'instagramAccountTag',
  'instagramPhotoGuide', 'instagramReelsRequired',
] as const;
function object(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
}
function pick(source: Row, fields: readonly string[]) {
  return Object.fromEntries(fields.filter(field => field in source).map(field => [field, source[field]]));
}
function finiteCount(value: unknown): number | null {
  const count = typeof value === 'string' ? Number(value) : value;
  return typeof count === 'number' && Number.isFinite(count) ? count : null;
}
/**
 * DB 계산 컬럼(applicant_count, selected_count)을 기존 PostgREST 집계 형태
 * (applications: [{ count }], selected_applications: [{ count }])로 맞춘다.
 * 공개 화면이 applications 테이블 전체 권한 없이 신청 수를 표시하기 위한 변환이다.
 */
export function withRelationCounts<T extends Row>(campaign: T): T {
  const applicantCount = finiteCount(campaign.applicant_count);
  const selectedCount = finiteCount(campaign.selected_count);
  if (applicantCount === null && selectedCount === null) return campaign;
  return {
    ...campaign,
    ...(applicantCount === null ? {} : { applications: [{ count: applicantCount }] }),
    ...(selectedCount === null ? {} : { selected_applications: [{ count: selectedCount }] }),
  };
}
/** Called BEFORE persistent caching. No billing, coupons, drafts or private link pools. */
export function toPublicCampaign<T extends Row>(source: T): T {
  const campaign = withRelationCounts(source);
  const sanitize = (raw: unknown) => {
    const options = object(raw);
    const step1 = pick(object(options.step1Data), STEP1_PUBLIC_FIELDS);
    if (step1.productUrlPrivate || step1.productUrlIndividual) step1.productUrl = '';
    return {
      ...pick(options, ['keywords', 'stores', 'contact_method', 'contact_phone', 'official_price', 'mission_guide', 'autoExtension']),
      step1Data: step1,
      step2Data: pick(object(options.step2Data), STEP2_PUBLIC_FIELDS),
    };
  };
  return {
    ...campaign,
    campaign_options: Array.isArray(campaign.campaign_options)
      ? campaign.campaign_options.map(sanitize) : sanitize(campaign.campaign_options),
  };
}


/** Sanitize joined public campaign data while preserving PostgREST relation shape. */
export function toPublicCampaignRelation<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => toPublicCampaignRelation(item)) as T;
  if (!value || typeof value !== 'object') return value;
  return toPublicCampaign(value as Row) as T;
}
