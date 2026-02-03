import type { Metadata } from "next";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://daonview.com'),
  title: "랜딩페이지 | DAONVIEW",
  description: "AI로 생성된 전문 랜딩페이지",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 랜딩페이지는 Navbar/Footer 없이 순수 콘텐츠만 표시
  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
