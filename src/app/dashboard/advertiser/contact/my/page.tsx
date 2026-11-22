import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import MyInquiryList from '@/components/contact/MyInquiryList';

export const dynamic = 'force-dynamic';

export default async function AdvertiserMyInquiryPage() {
    await requireDashboardRole('ADVERTISER');
  return <MyInquiryList basePath="/dashboard/advertiser/contact" />;
}
