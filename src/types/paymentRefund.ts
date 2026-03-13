export type RefundRequestStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type RefundType = 'FULL' | 'PARTIAL';

export interface RefundRequestRecord {
  id: string;
  payment_id: string;
  requester_user_id: string;
  status: RefundRequestStatus;
  request_reason: string;
  admin_note: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  refund_type: RefundType | null;
  refund_amount: number | null;
}

export interface RefundRequestPresenter extends RefundRequestRecord {
  requester?: {
    id: string;
    nickname?: string | null;
    email?: string | null;
    company_name?: string | null;
  } | null;
  reviewer?: {
    id: string;
    nickname?: string | null;
    email?: string | null;
    company_name?: string | null;
  } | null;
}
