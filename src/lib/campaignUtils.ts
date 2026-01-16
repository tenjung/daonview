import { Campaign } from '@/types/database';

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

  // DB의 한글 데이터를 UI용 영문 키로 변환 (역호환성 유지)
  const typeMap: Record<string, string> = {
    '배송형': 'DELIVERY',
    '방문형': 'VISIT',
    '기자단': 'PRESS',
    '구매평': 'PURCHASE',
    'DELIVERY': 'DELIVERY',
    'VISIT': 'VISIT',
    'PRESS': 'PRESS',
    'PURCHASE': 'PURCHASE'
  };

  const platformMap: Record<string, string> = {
    '블로그': 'BLOG',
    '인스타': 'INSTAGRAM',
    '기타': 'OTHER',
    '구매평': 'PURCHASE',
    'BLOG': 'BLOG',
    'INSTAGRAM': 'INSTAGRAM',
    'OTHER': 'OTHER',
    'PURCHASE': 'PURCHASE'
  };

  // 캠페인 옵션에서 데이터 추출 시도 (임시저장 데이터 대응)
  const options = Array.isArray((campaign as any).campaign_options) ? (campaign as any).campaign_options[0] : (campaign as any).campaign_options;
  const provision = campaign.provision || (campaign as any).experience_details || options?.step1Data?.experienceDetails || '';
  const productName = (campaign as any).product_name || options?.step1Data?.productName || campaign.title;

  const rawPlatform = campaign.platform || 'BLOG';
  const rawType = campaign.type || 'VISIT';

  return {
    id: campaign.id,
    title: campaign.title || productName,
    platform: platformMap[rawPlatform] || (typeof rawPlatform === 'string' ? rawPlatform.toUpperCase() : 'BLOG'),
    type: typeMap[rawType] || (typeof rawType === 'string' ? rawType.toUpperCase() : 'VISIT'),
    applicants: applicants,
    total: campaign.recruit_count || 0,
    dday: campaign.is_always ? "상시" : formatDDay(campaign.end_date),
    category: campaign.category,
    region: (campaign as any).region || null,
    imageUrl: campaign.thumbnail_url || '',
    provision: provision,
    end_date: campaign.end_date,
    created_at: campaign.created_at,
  };
};
