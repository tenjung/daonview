export interface ReviewEmailNotification {
  // SENT는 메일 제공자의 발송 요청 접수이며, 수신함 도착을 뜻하지 않는다.
  status: 'NOT_REQUIRED' | 'SENT' | 'MOCK' | 'SKIPPED' | 'FAILED';
  message?: string;
}

export interface ManagedReview {
  id: number;
  campaign_id: number | null;
  user_id: string;
  post_url: string;
  platform: string;
  title: string | null;
  author_name: string | null;
  author_email: string | null;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  is_purchase_experience: boolean;
  proof_urls: string[];
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
}

