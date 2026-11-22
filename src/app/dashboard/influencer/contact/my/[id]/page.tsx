import { requireDashboardRole } from '@/lib/auth/requireDashboardRole';
import MyInquiryDetail from '@/components/contact/MyInquiryDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function InfluencerMyInquiryDetailPage({ params }: PageProps) {
    await requireDashboardRole('INFLUENCER');
  const { id } = await params;

  return <MyInquiryDetail id={id} basePath="/dashboard/influencer/contact" />;
}
