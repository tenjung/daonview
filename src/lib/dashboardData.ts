import 'server-only';
import { toPublicCampaignRelation } from '@/lib/publicCampaignDto';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { toClientProfile } from '@/lib/auth/clientProfile';
import type { Application, Campaign } from '@/types/database';

export interface DashboardApplication extends Application { campaigns: Campaign }
export interface DashboardFavorite { id: number; user_id: string; campaign_id: number; created_at: string; campaigns: Campaign }

export async function getInfluencerInitialData(kind: 'overview' | 'campaigns' | 'favorites' | 'reviews') {
  await requireDashboardRole('INFLUENCER');
  const { supabase, user, profile: rawProfile } = await getRequestAuth();
  const profile = toClientProfile(rawProfile);
  if (!user) throw new Error('인증이 필요합니다.');
  const viewer = { user, profile };
  if (kind === 'favorites') {
    const result = await supabase.from('favorites').select('*, campaigns(*, applicant_count, selected_count)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (result.error) throw new Error('관심 캠페인을 불러오지 못했습니다.');
    return { viewer, applications: [], favorites: (result.data as DashboardFavorite[]).map(row => ({ ...row, campaigns: toPublicCampaignRelation(row.campaigns) })), pending: [], submitted: [] };
  }
  if (kind === 'reviews') {
    const [pending, submitted] = await Promise.all([
      supabase.from('applications').select('id, status, created_at, campaign_id, review_deadline, purchased_at, campaigns(id, title, platform, type, end_date, created_by, campaign_options)')
        .eq('user_id', user.id).in('status', ['SELECTED', 'APPROVED']).or('review_submitted.is.null,review_submitted.eq.false').order('created_at', { ascending: false }),
      supabase.from('reviews').select('id, campaign_id, post_url, created_at, status, platform, campaigns(id, title, platform, type, end_date)')
        .eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (pending.error || submitted.error) throw new Error('리뷰 정보를 불러오지 못했습니다.');
    return { viewer, applications: [], favorites: [], pending: pending.data.map(row => ({ ...row, campaigns: toPublicCampaignRelation(row.campaigns) })), submitted: submitted.data.map(row => ({ ...row, campaigns: toPublicCampaignRelation(row.campaigns) })) };
  }
  let query = supabase.from('applications').select('*, campaigns(*)').eq('user_id', user.id).neq('status', 'CANCELLED').order('created_at', { ascending: false });
  if (kind === 'overview') query = query.limit(10);
  const result = await query;
  if (result.error) throw new Error('참여 캠페인을 불러오지 못했습니다.');
  return { viewer, applications: (result.data as DashboardApplication[]).map(row => ({ ...row, campaigns: toPublicCampaignRelation(row.campaigns) })), favorites: [], pending: [], submitted: [] };
}

export async function getAdvertiserInitialData(overview = false) {
  await requireDashboardRole('ADVERTISER');
  const { supabase, user, profile } = await getRequestAuth();
  if (!user) throw new Error('인증이 필요합니다.');
  let query = supabase.from('campaigns').select('*, applications(count)').eq('created_by', user.id).order('created_at', { ascending: false });
  if (overview) query = query.in('status', ['PENDING', 'RECRUITING', 'ONGOING']);
  const result = await query;
  if (result.error) throw new Error('캠페인을 불러오지 못했습니다.');
  return { viewer: { user, profile: toClientProfile(profile) }, campaigns: result.data as Campaign[] };
}
