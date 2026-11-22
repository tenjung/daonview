import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import InquiryFormCard from '@/components/contact/InquiryFormCard';

export default async function InfluencerContactPage() {
    await requireDashboardRole('INFLUENCER');
  return <InquiryFormCard basePath="/dashboard/influencer/contact" />;
}
