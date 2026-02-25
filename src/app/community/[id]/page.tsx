import { createClient as createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient';

import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data: post } = await supabase
        .from('posts')
        .select('title, content, type, created_at')
        .eq('id', id)
        .single();

    if (!post) return {};

    const cleanDescription = post.content.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();
    const siteTitle = '다온뷰 인사이트';
    
    return {
        title: `${post.title} | ${siteTitle}`,
        description: cleanDescription,
        openGraph: {
            title: post.title,
            description: cleanDescription,
            url: `/community/${id}`,
            type: 'article',
            publishedTime: post.created_at,
        },
    };
}

export default async function PostDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createServerClient();

    // Fetch post data
    const { data: post, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (
                nickname,
                name
            )
        `)
        .eq('id', id)
        .single();

    if (error || !post) return notFound();

    // Fetch initial comments with profile join for first paint
    const { data: commentsData } = await supabase
        .from('comments')
        .select(`
            *,
            profiles:user_id (
                nickname,
                name
            )
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true });

    return (
        <>
            {/* JSON-LD for Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": post.title,
                        "description": post.content.replace(/<[^>]*>?/gm, '').substring(0, 160).trim(),
                        "datePublished": post.created_at,
                        "author": {
                            "@type": "Organization",
                            "name": "다온뷰"
                        }
                    })
                }}
            />
            <PostDetailClient
                initialPost={post}
                initialComments={commentsData || []}
                id={id}
            />
        </>
    );
}
