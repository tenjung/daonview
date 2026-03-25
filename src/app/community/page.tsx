import type { Metadata } from 'next';
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: '커뮤니티',
  description: '공지, 이벤트, 운영 안내, 이용자 소통까지 다온뷰 커뮤니티에서 최신 소식과 실전 노하우를 확인하세요.',
  keywords: ['다온뷰 커뮤니티', '공지사항', '이벤트', '운영 안내', '체험단 노하우', '이용자 소통'],
  openGraph: {
    title: '커뮤니티 | 다온뷰',
    description: '공지, 이벤트, 운영 안내, 이용자 소통까지 다온뷰 커뮤니티에서 최신 소식과 실전 노하우를 확인하세요.',
    url: 'https://daonview.com/community',
    images: [{ url: '/og-daon.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://daonview.com/community',
  },
};

export default function CommunityPage() {
  redirect("/community/feedback");
}
