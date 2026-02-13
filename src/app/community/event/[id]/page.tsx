import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PostDetailLayout from '@/components/community/PostDetailLayout';

import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;

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

    // Fetch event data (from notices table since events are stored there with type='이벤트')
    const { data: post, error } = await supabase
        .from('notices')
        .select('*, profiles(nickname)')
        .eq('id', id)
        .eq('type', '이벤트')
        .single();

    if (error || !post) return notFound();

    // Increment view count
    await supabase.rpc('increment_notice_view_count', { notice_id: id });

    const authorName = (post as any).profiles?.nickname || '관리자';

    return (
        <PostDetailLayout
            backLink="/community/event"
            typeLabel="이벤트"
            typeColor="bg-orange-50 text-orange-500 border-orange-100"
            isPinned={post.is_pinned}
            title={post.title}
            author={authorName}
            createdAt={new Date(post.created_at).toLocaleDateString()}
            viewCount={(post.view_count || 0) + 1}
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
