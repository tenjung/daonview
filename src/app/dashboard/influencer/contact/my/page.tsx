import MyInquiryList from '@/components/contact/MyInquiryList';

export const dynamic = 'force-dynamic';

export default async function InfluencerMyInquiryPage() {
  return <MyInquiryList basePath="/dashboard/influencer/contact" />;
}
