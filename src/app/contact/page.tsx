import type { Metadata } from 'next';
import InquiryFormCard from '@/components/contact/InquiryFormCard';

export const metadata: Metadata = {
  title: '문의하기',
  description: '서비스 이용, 제휴, 오류 접수까지 다온뷰 고객 문의를 남겨주세요. 담당자가 확인 후 빠르게 안내드립니다.',
  keywords: ['다온뷰 문의', '고객 상담', '제휴 문의', '서비스 문의', '오류 접수', '문의하기'],
  openGraph: {
    title: '문의하기 | 다온뷰',
    description: '서비스 이용, 제휴, 오류 접수까지 다온뷰 고객 문의를 남겨주세요. 담당자가 확인 후 빠르게 안내드립니다.',
    url: 'https://daonview.com/contact',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/contact',
  },
};

export default function ContactPage() {
  return <InquiryFormCard />;
}
