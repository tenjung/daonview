import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import { redirect } from 'next/navigation';

export default async function AdminInfluencersRedirect() {
    await requireDashboardRole('ADMIN');
    redirect('/dashboard/admin/users?tab=INFLUENCER');
}
