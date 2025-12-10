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
  title: "DAONVIEW | 프리미엄 체험단 플랫폼",
  description: "블로그, 인스타그램, 유튜브 체험단 마케팅 플랫폼 다온뷰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Navbar />
        <main style={{ minHeight: '80vh' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
