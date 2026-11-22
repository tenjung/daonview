import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { getRequestAuth } from '@/lib/auth/requestAuth';
import { toClientProfile } from '@/lib/auth/clientProfile';
import { getManagedReviewsForActor } from '@/lib/reviews/management';
import PageClient from './PageClient';
export default async function Page() {
 const { userId } = await requireDashboardRole('ADVERTISER');
 const { user, profile } = await getRequestAuth();
 if (!user) throw new Error('인증이 필요합니다.');
 const reviews = await getManagedReviewsForActor(userId);
 return <PageClient initialViewer={{ user, profile: toClientProfile(profile) }} initialReviews={reviews} />;
}
