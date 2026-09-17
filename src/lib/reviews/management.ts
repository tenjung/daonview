import 'server-only';

import { isAdminRole, normalizeRoleValue } from '@/lib/campaignPermissions';
import { isPurchaseReviewCampaign } from '@/lib/campaignPurchase';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ManagedReview } from '@/types/reviewManagement';

interface ReviewRow {
  id: number;
  campaign_id: number | null;
  user_id: string | null;
  post_url: string;
  platform: string;
  title: string | null;
  author_name: string | null;
  thumbnail_url: string | null;
  status: string | null;
  created_at: string;
}

interface CampaignRow {
  id: number;
  title: string;
  type: string | null;
  platform: string | null;
  campaign_options: unknown;
}

interface ApplicationRow {
  id: number;
  campaign_id: number | null;
  user_id: string | null;
  review_media_urls: unknown;
}

interface ProfileRow {
  id: string;
  email: string | null;
  nickname: string | null;
  name: string | null;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
}

const pairKey = (campaignId: number | null, userId: string | null) => `${campaignId ?? ''}:${userId ?? ''}`;

const parseProofUrls = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && /^https?:\/\//i.test(item));
};

export async function getManagedReviewsForActor(actorId: string): Promise<ManagedReview[]> {
  const admin = createAdminClient();
  const { data: actorProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', actorId)
    .maybeSingle();

  const role = normalizeRoleValue(actorProfile?.role);
  const isAdmin = isAdminRole(role);
  let allowedCampaignIds: number[] | null = null;

  if (!isAdmin) {
    if (role !== 'ADVERTISER') return [];
    const { data: ownedCampaigns, error: ownedCampaignsError } = await admin
      .from('campaigns')
      .select('id')
      .eq('created_by', actorId);
    if (ownedCampaignsError) throw ownedCampaignsError;
    allowedCampaignIds = (ownedCampaigns || []).map((campaign) => Number(campaign.id));
    if (allowedCampaignIds.length === 0) return [];
  }

  let reviewQuery = admin
    .from('reviews')
    .select('id, campaign_id, user_id, post_url, platform, title, author_name, thumbnail_url, status, created_at')
    .order('created_at', { ascending: false });

  if (allowedCampaignIds) reviewQuery = reviewQuery.in('campaign_id', allowedCampaignIds);
  const { data: reviewData, error: reviewError } = await reviewQuery;
  if (reviewError) throw reviewError;

  const reviews = (reviewData || []) as ReviewRow[];
  if (reviews.length === 0) return [];

  const campaignIds = Array.from(new Set(reviews.map((review) => review.campaign_id).filter((id): id is number => id != null)));
  const userIds = Array.from(new Set(reviews.map((review) => review.user_id).filter((id): id is string => Boolean(id))));

  const [campaignsResult, applicationsResult, profilesResult] = await Promise.all([
    admin
      .from('campaigns')
      .select('id, title, type, platform, campaign_options')
      .in('id', campaignIds),
    admin
      .from('applications')
      .select('id, campaign_id, user_id, review_media_urls')
      .in('campaign_id', campaignIds)
      .in('user_id', userIds)
      .eq('review_submitted', true)
      .order('id', { ascending: false }),
    admin
      .from('profiles')
      .select('id, email, nickname, name, bank_name, account_holder, account_number')
      .in('id', userIds),
  ]);

  if (campaignsResult.error) throw campaignsResult.error;
  if (applicationsResult.error) throw applicationsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const campaigns = new Map(((campaignsResult.data as CampaignRow[] | null) || []).map((campaign) => [campaign.id, campaign]));
  const profiles = new Map(((profilesResult.data as ProfileRow[] | null) || []).map((profile) => [profile.id, profile]));
  const applications = new Map<string, ApplicationRow>();
  for (const application of ((applicationsResult.data as ApplicationRow[] | null) || [])) {
    const key = pairKey(application.campaign_id, application.user_id);
    if (!applications.has(key)) applications.set(key, application);
  }

  return reviews.map((review) => {
    const campaign = review.campaign_id == null ? null : campaigns.get(review.campaign_id) || null;
    const profile = review.user_id ? profiles.get(review.user_id) || null : null;
    const application = applications.get(pairKey(review.campaign_id, review.user_id)) || null;
    const isPurchaseExperience = isPurchaseReviewCampaign(campaign);
    const proofUrls = parseProofUrls(application?.review_media_urls);

    return {
      id: review.id,
      campaign_id: review.campaign_id,
      user_id: review.user_id || '',
      post_url: review.post_url,
      platform: String(review.platform || '').toUpperCase(),
      title: review.title || campaign?.title || null,
      author_name: review.author_name || profile?.nickname || profile?.name || null,
      author_email: profile?.email || null,
      thumbnail_url: review.thumbnail_url,
      status: String(review.status || 'PENDING').toUpperCase(),
      created_at: review.created_at,
      is_purchase_experience: isPurchaseExperience,
      proof_urls: proofUrls,
      bank_name: isPurchaseExperience ? profile?.bank_name || null : null,
      account_holder: isPurchaseExperience ? profile?.account_holder || null : null,
      account_number: isPurchaseExperience ? profile?.account_number || null : null,
    };
  });
}
