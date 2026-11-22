import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { getAdvertiserInitialData } from '@/lib/dashboardData';
import PageClient from './PageClient';
export default async function Page() {
 await requireDashboardRole('ADVERTISER');
 const data = await getAdvertiserInitialData(true);
 return <PageClient initialViewer={data.viewer} initialCampaigns={data.campaigns} />;
}
