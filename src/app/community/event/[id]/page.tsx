import { createClient as createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PostDetailLayout from '@/components/community/PostDetailLayout';
import { incrementCommunityViewCount } from '@/lib/community/view-count';

import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

function formatKoreanDate(input: string): string {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '-';

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data: post } = await supabase
        .from('notices')
        .select('title, content, created_at')
        .eq('id', id)
        .eq('type', '이벤트')
        .single();

    if (!post) return {};

    const cleanDescription = post.content.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();

    return {
        title: `${post.title} | 다온뷰 이벤트`,
        description: cleanDescription,
        openGraph: {
            title: post.title,
            description: cleanDescription,
            url: `/community/event/${id}`,
            type: 'article',
            publishedTime: post.created_at,
        },
    };
}

export default async function EventDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createServerClient();

    // Fetch event data (from notices table since events are stored there with type='이벤트')
    const { data: post, error } = await supabase
        .from('notices')
        .select('*, profiles(nickname)')
        .eq('id', id)
        .eq('type', '이벤트')
        .single();

    if (error || !post) return notFound();

    const nextViewCount = (post.view_count || 0) + 1;
    await incrementCommunityViewCount('NOTICE', id, nextViewCount);

    const postWithProfile = post as typeof post & {
        profiles?: { nickname?: string } | null;
    };
    const authorName = postWithProfile.profiles?.nickname || '관리자';

    return (
        <PostDetailLayout
            backLink="/community/event"
            typeLabel="이벤트"
            typeColor="bg-orange-50 text-orange-500 border-orange-100"
            isPinned={post.is_pinned}
            title={post.title}
            author={authorName}
            createdAt={formatKoreanDate(post.created_at)}
            viewCount={nextViewCount}
        >
            {/* JSON-LD for Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Event",
                        "name": post.title,
                        "description": post.content.replace(/<[^>]*>?/gm, '').substring(0, 160).trim(),
                        "startDate": post.created_at,
                        "location": {
                            "@type": "Place",
                            "name": "다온뷰 온라인"
                        },
                        "organizer": {
                            "@type": "Organization",
                            "name": "다온뷰"
                        }
                    })
                }}
            />

            <div 
                className="prose prose-xs md:prose-sm max-w-none prose-slate prose-img:rounded-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />
        </PostDetailLayout>
    );
}
