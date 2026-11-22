import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import MyInquiryDetail from '@/components/contact/MyInquiryDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdvertiserMyInquiryDetailPage({ params }: PageProps) {
    await requireDashboardRole('ADVERTISER');
  const { id } = await params;

  return <MyInquiryDetail id={id} basePath="/dashboard/advertiser/contact" />;
}
