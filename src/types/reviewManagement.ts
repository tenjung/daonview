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

