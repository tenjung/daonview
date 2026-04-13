import type { Metadata } from 'next';
import IntroClient from './IntroClient';

export const metadata: Metadata = {
  title: '광고주 파트너십',
  description: '기업과 브랜드를 위한 다온뷰 광고주 파트너십입니다. 체험단 마케팅, 리뷰 운영, 숏폼 콘텐츠로 브랜드 성장 전략을 상담하세요.',
  keywords: ['광고주 파트너십', '기업 파트너십', '체험단 마케팅', '리뷰 운영', '브랜드 성장', '다온뷰 광고주'],
  openGraph: {
    title: '광고주 파트너십 | 다온뷰',
    description: '기업과 브랜드를 위한 다온뷰 광고주 파트너십입니다. 체험단 마케팅, 리뷰 운영, 숏폼 콘텐츠로 브랜드 성장 전략을 상담하세요.',
    url: 'https://daonview.com/partner/intro',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/partner/intro',
  },
};

export default function IntroPage() {
  return <IntroClient />;
}
