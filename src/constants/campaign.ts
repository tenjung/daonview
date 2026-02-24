export const ACTIVE_CAMPAIGN_STATUSES = ['RECRUITING', 'ONGOING'] as const;

export type ActiveCampaignStatus = (typeof ACTIVE_CAMPAIGN_STATUSES)[number];

export type CampaignStatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  PENDING: '요청중',
  RECRUITING: '모집중',
  ONGOING: '진행중',
  COMPLETED: '완료',
  DRAFT: '임시저장',
  REJECTED: '거절됨',
};

export const CAMPAIGN_STATUS_VARIANTS: Record<string, CampaignStatusBadgeVariant> = {
  PENDING: 'outline',
  RECRUITING: 'default',
  ONGOING: 'default',
  COMPLETED: 'secondary',
  DRAFT: 'secondary',
  REJECTED: 'destructive',
};
