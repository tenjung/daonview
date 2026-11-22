import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import PageClient from './PageClient';

export default async function Page() {
  await requireDashboardRole('ADMIN');
  return <PageClient />;
}
