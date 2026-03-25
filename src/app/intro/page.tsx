import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '플랫폼 소개',
  description: '다온뷰 플랫폼의 서비스 구조와 핵심 특징을 소개합니다. 브랜드 협업, 체험단 운영, 인플루언서 성장 흐름을 한눈에 확인하세요.',
  keywords: ['다온뷰 소개', '플랫폼 소개', '체험단 플랫폼', '브랜드 협업', '인플루언서 성장', '서비스 개요'],
  openGraph: {
    title: '플랫폼 소개 | 다온뷰',
    description: '다온뷰 플랫폼의 서비스 구조와 핵심 특징을 소개합니다. 브랜드 협업, 체험단 운영, 인플루언서 성장 흐름을 한눈에 확인하세요.',
    url: 'https://daonview.com/intro',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/intro',
  },
};

export default function IntroRedirectPage() {
  redirect('/partner/intro');
}
