import { requireDashboardRoles } from '@/lib/auth/requireDashboardRole';
import PageClient from './PageClient';
export default async function Page() {
 await requireDashboardRoles(['ADMIN', 'ADVERTISER']);
 return <PageClient />;
}
