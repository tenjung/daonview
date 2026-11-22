import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { redirect } from 'next/navigation';

export default async function AdminAdvertisersRedirect() {
    await requireDashboardRole('ADMIN');
    redirect('/dashboard/admin/users?tab=ADVERTISER');
}
