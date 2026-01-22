import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Keep fonts if they exist, or remove if not needed. I'll keep them.
import { createClient } from '@/lib/supabase/server';
import { Toaster } from 'sonner';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 동적 메타데이터 생성을 위한 함수
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();

  // 브랜드 설정 가져오기
  const { data: settings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'brand_config')
    .single();

  const brandConfig = settings?.value as any;
  const faviconUrl = brandConfig?.favicon_url || "/favicon.ico";

  return {
    metadataBase: new URL('https://daonview.com'),
    title: "다온뷰 | DAONVIEW - 혜택이 다가온 체험단 플랫폼",
    description: "블로그·인스타·유튜브 체험단 혜택이 다온뷰에서 시작됩니다. 다양한 브랜드와의 협업 기회를 만나보세요.",
    keywords: ["체험단", "블로그체험단", "인스타체험단", "마케팅플랫폼", "다온뷰", "바이럴마케팅"],
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      title: "DAONVIEW | 혜택으로 다가온 리뷰",
      description: "블로그·인스타·유튜브 체험단 혜택, 다온뷰에서 시작하세요",
      url: "https://www.daonview.com",
      siteName: "DAONVIEW",
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
  };
}


import AuthHydrator from '@/components/auth/AuthHydrator';
import OnboardingChecker from '@/components/auth/OnboardingChecker';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // 서버 사이드에서 세션 및 프로필 미리 가져오기
  const { data: { session } } = await supabase.auth.getSession();
  let profile = null;

  if (session?.user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    profile = profileData;
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <AuthHydrator user={session?.user ?? null} profile={profile} />
        <OnboardingChecker />
        <Navbar initialUser={session?.user ?? null} initialProfile={profile} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
