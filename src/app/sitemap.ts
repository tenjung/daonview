import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ACTIVE_CAMPAIGN_STATUSES } from '@/constants/campaign';

// Supabase 클라이언트를 직접 노출하지 않고 환경변수로 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://daonview.com';

  // 1. 캠페인 데이터 가져오기
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, updated_at')
    .in('status', ACTIVE_CAMPAIGN_STATUSES as unknown as string[]);

  const campaignUrls = (campaigns || []).map((campaign) => ({
    url: `${baseUrl}/campaigns/${campaign.id}`,
    lastModified: new Date(campaign.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 2. 공지사항 데이터 가져오기
  const { data: notices } = await supabase
    .from('notices')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  const noticeUrls = (notices || []).map((notice) => ({
    url: `${baseUrl}/community/notice/${notice.id}`,
    lastModified: new Date(notice.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  // 3. 커뮤니티 게시글(Posts) 가져오기 (다온뷰 인사이트 등)
  const { data: communityPosts } = await supabase
    .from('posts')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  const communityUrls = (communityPosts || []).map((post) => ({
    url: `${baseUrl}/community/${post.id}`,
    lastModified: new Date(post.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 4. 정적 페이지들
  const staticPages = [
    { url: '', priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/campaigns', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/reviews', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/community', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/community/notice', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/community/feedback', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/community/academy', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/ai-service', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/ai-service/writing-assistant', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/partner', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/partner/intro', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/partner/brand-video', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
  ].map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  return [...staticPages, ...campaignUrls, ...noticeUrls, ...communityUrls];
}
