import { Campaign } from '@/types/database';

export const formatDDay = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();

  // Handle 'Always' date (e.g. year 9999)
  if (end.getFullYear() > 2100) return "상시모집";

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "종료";
  if (diffDays === 0) return "D-0";
  return `D-${diffDays}`;
};

export const mapCampaignToCard = (campaign: Campaign & { applications?: { count: number }[] | { count: number } | number, is_always?: boolean }) => {
  // Handle Supabase count response which might be an array or object or number depending on query
  let applicants = 0;
  if (Array.isArray(campaign.applications)) {
    applicants = campaign.applications[0]?.count || 0;
  } else if (typeof campaign.applications === 'object' && campaign.applications !== null) {
    // @ts-ignore
    applicants = campaign.applications.count || 0;
  }

  // Prioritize is_always flag
  const dday = campaign.is_always ? "상시모집" : formatDDay(campaign.end_date);

  return {
    id: campaign.id,
    title: campaign.title,
    platform: campaign.platform,
    type: campaign.type,
    applicants: applicants,
    total: campaign.recruit_count,
    dday: dday,
    category: campaign.category,
    region: (campaign as any).region || null, // Use actual region from database
    imageUrl: campaign.thumbnail_url || '',
    provision: (campaign as any).provision || '',
  };
};
