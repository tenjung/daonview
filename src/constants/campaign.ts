export const ACTIVE_CAMPAIGN_STATUSES = ['RECRUITING', 'ONGOING'] as const;

export type ActiveCampaignStatus = (typeof ACTIVE_CAMPAIGN_STATUSES)[number];
