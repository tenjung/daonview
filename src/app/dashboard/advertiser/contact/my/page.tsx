import MyInquiryList from '@/components/contact/MyInquiryList';

export const dynamic = 'force-dynamic';

export default async function AdvertiserMyInquiryPage() {
  return <MyInquiryList basePath="/dashboard/advertiser/contact" />;
}
