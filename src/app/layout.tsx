import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Keep fonts if they exist, or remove if not needed. I'll keep them.
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

export const metadata: Metadata = {
  title: "DAONVIEW | 성공을 돕는 프리미엄 체험단 플랫폼",
  description: "마케팅 전문가가 검증한 블로그, 인스타그램, 유튜브 체험단. 매출로 이어지는 진짜 마케팅을 경험하세요.",
  keywords: ["체험단", "블로그체험단", "인스타체험단", "마케팅플랫폼", "다온뷰", "바이럴마케팅"],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "DAONVIEW | 프리미엄 체험단 플랫폼",
    description: "성공적인 마케팅의 시작, 다온뷰와 함께하세요.",
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


import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
