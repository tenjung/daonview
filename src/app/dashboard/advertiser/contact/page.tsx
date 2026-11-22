import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import InquiryFormCard from '@/components/contact/InquiryFormCard';

export default async function AdvertiserContactPage() {
    await requireDashboardRole('ADVERTISER');
  return <InquiryFormCard basePath="/dashboard/advertiser/contact" />;
}
