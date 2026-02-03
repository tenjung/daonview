import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HeroSection } from '@/components/lp/HeroSection';
import { StatsSection } from '@/components/lp/StatsSection';
import { PortfolioSection } from '@/components/lp/PortfolioSection';
import { ContactSection } from '@/components/lp/ContactSection';
import { LandingPage } from '@/types/landingPage';

// ISR: 1시간마다 재검증
export const revalidate = 3600;

async function getLandingPage(slug: string): Promise<LandingPage | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/landing-pages/${slug}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.landingPage;
  } catch (error) {
    console.error('랜딩페이지 조회 오류:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landingPage = await getLandingPage(slug);

  if (!landingPage) {
    return {
      title: '페이지를 찾을 수 없습니다',
    };
  }

  const { title, ai_generated_content } = landingPage;
  const { hero } = ai_generated_content;

  return {
    title: `${title} | 다온뷰`,
    description: hero.subheadline,
    openGraph: {
      title,
      description: hero.subheadline,
      type: 'website',
      url: `https://daonview.com/lp/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: hero.subheadline,
    },
  };
}

export default async function LandingPageViewer({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landingPage = await getLandingPage(slug);

  if (!landingPage) {
    notFound();
  }

  const { ai_generated_content } = landingPage;
  const { hero, stats, portfolio, contact, colorScheme } = ai_generated_content;

  return (
    <main className="min-h-screen bg-white">
      <HeroSection hero={hero} colorScheme={colorScheme} />
      <StatsSection stats={stats} colorScheme={colorScheme} />
      <PortfolioSection portfolio={portfolio} colorScheme={colorScheme} />
      <ContactSection contact={contact} colorScheme={colorScheme} />
    </main>
  );
}
