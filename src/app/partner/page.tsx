import type { Metadata } from 'next';
import PartnerBusinessPageClient from './PartnerBusinessPageClient';

export const metadata: Metadata = {
  title: '기업 파트너십',
  description: '다온뷰 체험단·기사 콘텐츠 기반으로 브랜드 신뢰를 보강하고 오프라인, 폐쇄몰, 라이브커머스, 수출 판로 확장을 설계합니다.',
  keywords: ['기업 파트너십', '다온컴퍼니', '다온뷰', '판로 확장', '기사 송출', '보도자료', '판매 채널 입점', 'B2B 유통', '라이브커머스', '수출'],
  openGraph: {
    title: '기업 파트너십 | 다온뷰',
    description: '다온뷰 체험단·기사 콘텐츠 기반으로 브랜드 신뢰를 보강하고 오프라인·폐쇄몰·라이브커머스·수출 판로를 상담합니다.',
    url: 'https://daonview.com/partner',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/partner',
  },
};

export default function PartnerLandingPage() {
  return <PartnerBusinessPageClient />;
}
