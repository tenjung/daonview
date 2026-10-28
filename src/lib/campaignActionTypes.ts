export type CampaignAction = 'APPROVE' | 'REJECT' | 'CLOSE';

export const CAMPAIGN_ACTION_LABELS: Record<CampaignAction, string> = {
  APPROVE: '승인', REJECT: '거절', CLOSE: '마감',
};

export function canApplyCampaignAction(action: CampaignAction, status: string | null | undefined) {
  const normalized = (status || '').toUpperCase();
  return action === 'CLOSE'
    ? normalized === 'RECRUITING' || normalized === 'ONGOING'
    : normalized === 'PENDING';
}

export interface CampaignActionCampaign {
  id: number;
  title: string;
  status: 'RECRUITING' | 'REJECTED' | 'COMPLETED';
  end_date: string | null;
}

export interface CampaignActionResult {
  id: number;
  title?: string;
  outcome: 'SUCCESS' | 'WARNING' | 'SKIPPED' | 'FAILED';
  message: string;
  warnings?: string[];
  campaign?: CampaignActionCampaign;
  httpStatus?: number;
}

export interface CampaignBulkResponse {
  results: CampaignActionResult[];
  cacheWarning?: string;
}
