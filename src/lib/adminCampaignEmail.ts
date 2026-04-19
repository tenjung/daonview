export const CAMPAIGN_PROMOTION_EMAIL_SUBJECT = '[다온뷰] 지금 신청 가능한 캠페인을 확인해 보세요';

export type AdminCampaignEmailType = 'DELIVERY' | 'VISIT';
export type AdminCampaignEmailStatus = 'RECRUITING' | 'ONGOING';

export interface AdminCampaignEmailRawCampaign {
  id: number;
  title: string;
  status: string | null;
  type: string | null;
  platform: string | null;
  category: string | null;
  region: string | null;
  sub_region: string | null;
  brand_name: string | null;
  product_name: string | null;
  experience_details: string | null;
  description: string | null;
  thumbnail_url: string | null;
  end_date: string | null;
  campaign_options: unknown;
  store_locations: unknown;
}

export interface AdminCampaignEmailCampaign {
  id: number;
  title: string;
  status: AdminCampaignEmailStatus;
  type: AdminCampaignEmailType;
  platform: string;
  category: string;
  regionLabel: string;
  intro: string;
  providedItems: string;
  storeName: string;
  storeAddress: string;
  thumbnailUrl: string;
  detailUrl: string;
  endDate: string;
  deliveryPlatformLabel: string;
  deliveryChannelLabels: string[];
  deliverySortPriority: number;
}

interface StoreLocationLike {
  storeName?: unknown;
  name?: unknown;
  address?: unknown;
  roadAddress?: unknown;
  naverPlaceUrl?: unknown;
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://daonview.com').replace(/\/$/, '');
}

function getText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getCampaignOptions(rawOptions: unknown) {
  if (Array.isArray(rawOptions)) {
    return (rawOptions[0] || {}) as Record<string, unknown>;
  }

  if (rawOptions && typeof rawOptions === 'object') {
    return rawOptions as Record<string, unknown>;
  }

  return {};
}

function getFirstStore(rawCampaign: AdminCampaignEmailRawCampaign): StoreLocationLike {
  if (Array.isArray(rawCampaign.store_locations) && rawCampaign.store_locations.length > 0) {
    return (rawCampaign.store_locations[0] || {}) as StoreLocationLike;
  }

  const options = getCampaignOptions(rawCampaign.campaign_options);
  const optionStores = options.stores;
  if (Array.isArray(optionStores) && optionStores.length > 0) {
    return (optionStores[0] || {}) as StoreLocationLike;
  }

  const step1Data = options.step1Data;
  if (step1Data && typeof step1Data === 'object') {
    const step1Stores = (step1Data as Record<string, unknown>).stores;
    if (Array.isArray(step1Stores) && step1Stores.length > 0) {
      return (step1Stores[0] || {}) as StoreLocationLike;
    }
  }

  return {};
}

function getRegionLabel(rawCampaign: AdminCampaignEmailRawCampaign, store: StoreLocationLike) {
  const regionParts = [rawCampaign.region, rawCampaign.sub_region]
    .map(getText)
    .filter(Boolean);

  if (regionParts.length > 0) {
    return regionParts.join(' ');
  }

  const address = getText(store.address) || getText(store.roadAddress);
  return address ? address.split(' ').slice(0, 2).join(' ') : '지역 확인 필요';
}

function getIntro(rawCampaign: AdminCampaignEmailRawCampaign) {
  return (
    getText(rawCampaign.description) ||
    getText(rawCampaign.experience_details) ||
    getText(rawCampaign.product_name) ||
    getText(rawCampaign.brand_name) ||
    '캠페인 상세 페이지에서 확인해 주세요.'
  );
}

function getBoolean(value: unknown) {
  return value === true || String(value || '').toUpperCase() === 'TRUE';
}

function getStep1Data(rawCampaign: AdminCampaignEmailRawCampaign) {
  const options = getCampaignOptions(rawCampaign.campaign_options);
  const step1Data = options.step1Data;

  if (step1Data && typeof step1Data === 'object') {
    return step1Data as Record<string, unknown>;
  }

  return {};
}

function getDeliveryChannelLabels(rawCampaign: AdminCampaignEmailRawCampaign) {
  const step1Data = getStep1Data(rawCampaign);
  const platform = String(rawCampaign.platform || step1Data.platform || '').toUpperCase();
  const hasIncludeKeys =
    Object.prototype.hasOwnProperty.call(step1Data, 'includeReview') ||
    Object.prototype.hasOwnProperty.call(step1Data, 'includeNaver') ||
    Object.prototype.hasOwnProperty.call(step1Data, 'includeInstagram');

  let includeReview = getBoolean(step1Data.includeReview);
  let includeNaver = getBoolean(step1Data.includeNaver);
  let includeInstagram = getBoolean(step1Data.includeInstagram);

  if (!hasIncludeKeys || (!includeReview && !includeNaver && !includeInstagram)) {
    includeReview = platform === 'PURCHASE';
    includeNaver = platform === 'BLOG' || platform === 'NAVER_BLOG';
    includeInstagram = platform === 'INSTAGRAM';
  }

  const labels = [
    includeReview ? '구매평' : '',
    includeNaver ? '블로그' : '',
    includeInstagram ? '인스타그램' : '',
  ].filter(Boolean);

  return labels.length > 0 ? labels : ['배송'];
}

function getDeliveryPlatformLabel(labels: string[]) {
  if (labels.length === 1) {
    if (labels[0] === '구매평') return '구매평만';
    if (labels[0] === '블로그') return '블로그만';
    if (labels[0] === '인스타그램') return '인스타그램만';
    return labels[0];
  }

  return labels.join(' + ');
}

function getDeliverySortPriority(labels: string[]) {
  const hasReview = labels.includes('구매평');
  const hasBlog = labels.includes('블로그');
  const hasInstagram = labels.includes('인스타그램');

  if (hasBlog && !hasReview && !hasInstagram) return 1;
  if (hasReview && !hasBlog && !hasInstagram) return 2;
  if (hasReview && (hasBlog || hasInstagram)) return 3;
  if (hasInstagram && !hasReview && !hasBlog) return 4;
  return 5;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeAdminCampaignForEmail(
  rawCampaign: AdminCampaignEmailRawCampaign
): AdminCampaignEmailCampaign | null {
  const type = String(rawCampaign.type || '').toUpperCase();
  const status = String(rawCampaign.status || '').toUpperCase();

  if (type !== 'DELIVERY' && type !== 'VISIT') return null;
  if (status !== 'RECRUITING' && status !== 'ONGOING') return null;

  const store = getFirstStore(rawCampaign);
  const intro = getIntro(rawCampaign);
  const providedItems = getText(rawCampaign.experience_details) || getText(rawCampaign.product_name) || intro;
  const storeName = getText(store.storeName) || getText(store.name);
  const storeAddress = getText(store.address) || getText(store.roadAddress);
  const deliveryChannelLabels = type === 'DELIVERY' ? getDeliveryChannelLabels(rawCampaign) : [];

  return {
    id: rawCampaign.id,
    title: rawCampaign.title,
    status,
    type,
    platform: String(rawCampaign.platform || '').toUpperCase() || 'BLOG',
    category: getText(rawCampaign.category) || '카테고리 없음',
    regionLabel: getRegionLabel(rawCampaign, store),
    intro,
    providedItems,
    storeName,
    storeAddress,
    thumbnailUrl: getText(rawCampaign.thumbnail_url),
    detailUrl: `${getSiteUrl()}/campaigns/${rawCampaign.id}`,
    endDate: getText(rawCampaign.end_date),
    deliveryPlatformLabel: type === 'DELIVERY' ? getDeliveryPlatformLabel(deliveryChannelLabels) : '',
    deliveryChannelLabels,
    deliverySortPriority: type === 'DELIVERY' ? getDeliverySortPriority(deliveryChannelLabels) : 0,
  };
}

export function buildCampaignPromotionEmailHtml(campaigns: AdminCampaignEmailCampaign[]) {
  const selectedCampaigns = campaigns.filter((campaign) => campaign.type === 'DELIVERY' || campaign.type === 'VISIT');

  const campaignCard = (campaign: AdminCampaignEmailCampaign) => {
    const metaLabel = campaign.type === 'DELIVERY'
      ? `${campaign.deliveryPlatformLabel} · 배송`
      : `${campaign.regionLabel} · 방문`;
    const detailLabel = campaign.type === 'DELIVERY'
      ? `진행유형: ${campaign.deliveryPlatformLabel} / 제공내역: ${campaign.providedItems}`
      : `방문정보: ${campaign.storeName || campaign.regionLabel}${campaign.storeAddress ? ` / ${campaign.storeAddress}` : ''}`;
    const imageHtml = campaign.thumbnailUrl
      ? `
        <img src="${escapeHtml(campaign.thumbnailUrl)}" alt="" style="float: left; display: block; width: 112px; height: 112px; object-fit: cover; margin: 0 18px 12px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
      `
      : '';
    const contentMarginStyle = campaign.thumbnailUrl ? 'min-height: 126px;' : '';

    return `
      <div style="margin: 0 0 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
        <div style="padding: 18px 18px 14px; ${contentMarginStyle}">
          ${imageHtml}
          <div style="display: inline-block; margin-bottom: 8px; padding: 5px 9px; border-radius: 8px; background: #fff1f2; color: #e11d48; font-size: 12px; line-height: 1.3; font-weight: 800;">
            ${escapeHtml(metaLabel)}
          </div>
          <h3 style="margin: 0 0 8px; color: #111827; font-size: 18px; line-height: 1.35; font-weight: 800;">
            ${escapeHtml(campaign.title)}
          </h3>
          <p style="margin: 0 0 10px; color: #475569; font-size: 14px; line-height: 1.6;">
            ${escapeHtml(campaign.intro)}
          </p>
          <div style="margin: 0; padding: 10px 12px; border-radius: 8px; background: #f8fafc; color: #64748b; font-size: 13px; line-height: 1.55;">
            ${escapeHtml(detailLabel)}
          </div>
          <div style="clear: both; height: 0; line-height: 0; font-size: 0;">&nbsp;</div>
        </div>
        <div style="padding: 0 18px 18px;">
          <a href="${escapeHtml(campaign.detailUrl)}" target="_blank" rel="noopener noreferrer" style="display: block; padding: 13px 16px; border-radius: 8px; background: #e11d48; color: #ffffff; font-size: 14px; line-height: 1.4; font-weight: 800; text-align: center; text-decoration: none;">
            상세 페이지에서 모집 조건 확인하기
          </a>
        </div>
      </div>
    `;
  };

  const emptyContent = `
    <div style="margin-top: 24px; padding: 22px; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
      선택된 캠페인이 없습니다. 왼쪽 목록에서 메일에 넣을 캠페인을 선택해 주세요.
    </div>
  `;

  const bodyContent = selectedCampaigns.length > 0
    ? `
      <div style="margin-top: 28px;">
        ${selectedCampaigns.map(campaignCard).join('')}
      </div>
    `
    : emptyContent;

  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(CAMPAIGN_PROMOTION_EMAIL_SUBJECT)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Arial, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;">
        <div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
          다온뷰에서 현재 신청 가능한 캠페인을 정리해 안내드립니다.
        </div>
        <div style="background: #f8fafc; padding: 32px 16px;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="padding: 30px 24px 22px; border-bottom: 1px solid #f1f5f9;">
              <div style="margin-bottom: 12px; color: #e11d48; font-size: 14px; line-height: 1.4; font-weight: 800; letter-spacing: 0;">DAONVIEW</div>
              <h1 style="margin: 0 0 10px; color: #111827; font-size: 28px; line-height: 1.3; font-weight: 900; letter-spacing: 0;">
                현재 신청 가능한 캠페인 안내
              </h1>
              <p style="margin: 0 0 12px; color: #475569; font-size: 15px; line-height: 1.7;">
                안녕하세요, 체험단 플랫폼 다온뷰입니다.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7;">
                현재 신청 가능한 캠페인 중 참고하실 만한 내용을 정리해 안내드립니다.<br>
                관심 있는 캠페인은 상세 페이지에서 모집 조건과 제공 내역을 확인해 주세요.
              </p>
            </div>
            <div style="padding: 6px 24px 30px;">
              ${bodyContent}
            </div>
            <div style="padding: 22px 24px; background: #f8fafc; color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">
              본 메일은 다온뷰 캠페인 안내 소식 메일입니다.<br>
              © 2026 다온뷰(Daonview). All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
