export const ACTIVE_CAMPAIGN_STATUSES = ['RECRUITING', 'ONGOING'] as const;
export const SELECTED_APPLICATION_STATUSES = ['SELECTED', 'APPROVED'] as const;

export type ActiveCampaignStatus = (typeof ACTIVE_CAMPAIGN_STATUSES)[number];


export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  PENDING: '요청중',
  RECRUITING: '모집중',
  ONGOING: '진행중',
  COMPLETED: '마감/완료',
  DRAFT: '임시저장',
  REJECTED: '거절됨',
};

