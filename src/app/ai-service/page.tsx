import type { Metadata } from "next";
import AIServicePageClient from "./AIServicePageClient";

export const metadata: Metadata = {
  title: "AI 인텔리전스",
  description: "포스팅 분석, AI 글작성, 랜딩페이지 생성, 영상 제작 도구까지 다온뷰 AI 서비스를 한 곳에서 이용하세요.",
  keywords: ["AI 포스팅 분석", "AI 글작성", "랜딩페이지 생성기", "영상 제작 도구", "다온뷰 AI", "인플루언서 AI"],
  openGraph: {
    title: "AI 인텔리전스 | 다온뷰",
    description: "포스팅 분석, AI 글작성, 랜딩페이지 생성, 영상 제작 도구까지 다온뷰 AI 서비스를 한 곳에서 이용하세요.",
    url: "https://daonview.com/ai-service",
    images: [{ url: "/og-daon.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://daonview.com/ai-service",
  },
};

export default function AIServicePage() {
  return <AIServicePageClient />;
}
