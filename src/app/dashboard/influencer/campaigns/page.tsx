import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { getInfluencerInitialData } from '@/lib/dashboardData';
import PageClient from './PageClient';
export default async function Page() {
  await requireDashboardRole('INFLUENCER');
  const data = await getInfluencerInitialData('campaigns');
  return <PageClient initialViewer={data.viewer} initialApplications={data.applications} />;
}
