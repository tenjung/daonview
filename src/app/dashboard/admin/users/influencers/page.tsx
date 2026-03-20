import { redirect } from 'next/navigation';

export default function AdminInfluencersRedirect() {
    redirect('/dashboard/admin/users?tab=INFLUENCER');
}
