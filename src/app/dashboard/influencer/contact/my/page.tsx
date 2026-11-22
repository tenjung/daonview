import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import MyInquiryList from '@/components/contact/MyInquiryList';

export const dynamic = 'force-dynamic';

export default async function InfluencerMyInquiryPage() {
    await requireDashboardRole('INFLUENCER');
  return <MyInquiryList basePath="/dashboard/influencer/contact" />;
}
