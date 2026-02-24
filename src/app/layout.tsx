import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://daonview.com'),
  title: {
    default: "다온뷰 | DAONVIEW - 혜택이 다가온 체험단 플랫폼",
    template: "%s | 다온뷰",
  },
  description: "블로그·인스타·유튜브 체험단 혜택이 다온뷰에서 시작됩니다. 다양한 브랜드와의 협업 기회를 만나보세요.",
  keywords: ["체험단", "블로그체험단", "인스타체험단", "마케팅플랫폼", "다온뷰", "바이럴마케팅", "인플루언서", "리뷰플랫폼"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "DAONVIEW | 혜택으로 다가온 리뷰",
    description: "블로그·인스타·유튜브 체험단 혜택, 다온뷰에서 시작하세요",
    url: "https://daonview.com",
    siteName: "다온뷰",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "다온뷰 서비스 미리보기",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE_CODE", // ← Google Search Console에서 발급받은 코드로 교체
    other: {
      "naver-site-verification": "f8f46433f56d1709f28778dc9cb0e568dd67531e",
    },
  },
  alternates: {
    canonical: 'https://daonview.com',
  },
  referrer: 'origin-when-cross-origin',
};

import AuthHydrator from '@/components/auth/AuthHydrator';
import AuthBootstrap from '@/components/auth/AuthBootstrap';
import OnboardingChecker from '@/components/auth/OnboardingChecker';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';

function isDynamicServerUsageError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE'
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버사이드에서 실제 세션 읽기 (SSR 쿠키 기반)
  let initialUser = null;
  let initialProfile = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      initialUser = user;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      initialProfile = profile ?? null;
    }
  } catch (e) {
    // 정적 생성 중 cookies 접근 시 발생하는 Next.js 내부 예외는 로그를 생략한다.
    if (isDynamicServerUsageError(e)) {
      initialUser = null;
      initialProfile = null;
    } else {
      // 그 외 예외만 로그로 남기고 클라이언트 fallback으로 동작
      console.error('[Layout] Server session fetch failed:', e);
    }
  }

  // JSON-LD 구조화 데이터: Google Sitelinks 노출을 위한 사이트 네비게이션 정의
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://daonview.com/#website",
        "url": "https://daonview.com",
        "name": "다온뷰",
        "alternateName": "DAONVIEW",
        "description": "블로그·인스타·유튜브 체험단 혜택이 다온뷰에서 시작됩니다.",
        "inLanguage": "ko-KR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://daonview.com/campaigns?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://daonview.com/#organization",
        "name": "다온뷰",
        "alternateName": "DAONVIEW",
        "url": "https://daonview.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://daonview.com/og-image.jpg"
        },
        "sameAs": [
          "https://daonview.com"
        ]
      },
      {
        "@type": "SiteLinksSearchBox",
        "url": "https://daonview.com",
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": "https://daonview.com/campaigns?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        ]
      }
    ]
  };

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* JSON-LD 구조화 데이터: Google Sitelinks & 사이트 인식 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        {/* 서버에서 읽은 실제 세션을 Zustand store에 즉시 주입 */}
        <AuthHydrator user={initialUser} profile={initialProfile} />
        <AuthBootstrap />
        <OnboardingChecker />
        <AppShell initialUser={initialUser} initialProfile={initialProfile}>
          {children}
        </AppShell>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
