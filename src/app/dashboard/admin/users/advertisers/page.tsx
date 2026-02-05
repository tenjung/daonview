import { redirect } from 'next/navigation';

export default function AdminAdvertisersRedirect() {
    redirect('/dashboard/admin/users?tab=ADVERTISER');
}
