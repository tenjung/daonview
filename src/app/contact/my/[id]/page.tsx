import MyInquiryDetail from '@/components/contact/MyInquiryDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function MyInquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <MyInquiryDetail id={id} />;
}
