import type { Metadata } from 'next';
import IntroClient from './IntroClient';

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '다온뷰의 체험단 마케팅 서비스를 소개합니다. 블로그·인스타·유튜브 리뷰어와 브랜드를 연결하는 고성능 리뷰 솔루션으로 매출을 극대화하세요.',
  keywords: ['체험단 서비스', '다온뷰 소개', '인플루언서 마케팅', '브랜드 체험단', '리뷰 마케팅', '광고주 서비스'],
  openGraph: {
    title: '서비스 소개 | 다온뷰',
    description: '다온뷰의 체험단 마케팅 서비스를 소개합니다. 블로그·인스타·유튜브 리뷰어와 브랜드를 연결하는 고성능 리뷰 솔루션.',
    url: 'https://daonview.com/intro',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/intro',
  },
};

export default function IntroPage() {
  return <IntroClient />;
}
