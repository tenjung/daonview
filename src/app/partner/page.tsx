import type { Metadata } from 'next';
import PartnerLandingPageClient from './PartnerLandingPageClient';

export const metadata: Metadata = {
  title: '숏폼 체험단',
  description: '광고주와 브랜드를 위한 다온뷰 숏폼 체험단입니다. 조회수 기반 콘텐츠와 인플루언서 협업으로 브랜드 성장을 상담하세요.',
  keywords: ['숏폼 체험단', '브랜드 체험단', '조회수 기반 콘텐츠', '인플루언서 협업', '광고주 문의', '다온뷰 파트너'],
  openGraph: {
    title: '숏폼 체험단 | 다온뷰',
    description: '광고주와 브랜드를 위한 다온뷰 숏폼 체험단입니다. 조회수 기반 콘텐츠와 인플루언서 협업으로 브랜드 성장을 상담하세요.',
    url: 'https://daonview.com/partner',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/partner',
  },
};

export default function PartnerLandingPage() {
  return <PartnerLandingPageClient />;
}
