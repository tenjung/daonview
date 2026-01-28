import { createClient as createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PostDetailLayout from '@/components/community/PostDetailLayout';
import PostActions from '@/components/community/PostActions';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createServerClient();

    // Fetch post data
    const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !post) return notFound();

    // Increment view count
    await supabase.from('posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', id);

    const getBackLink = () => {
        switch (post.type) {
            case 'FREE': return '/community/free';
            case 'BLOG_INTRO': return '/community/blog-intro';
            case 'ACADEMY_ADVERTISER': return '/community/academy/advertiser';
            case 'ACADEMY_INFLUENCER': return '/community/academy/influencer';
            default: return '/community';
        }
    };

    const getPostTypeLabel = () => {
        switch (post.type) {
            case 'FREE': return '자유게시판';
            case 'BLOG_INTRO': return '내 블로그 소개';
            case 'ACADEMY_ADVERTISER': return '광고주 칼럼';
            case 'ACADEMY_INFLUENCER': return '인플루언서 칼럼';
            default: return '게시글';
        }
    };

    return (
        <PostDetailLayout
            backLink={getBackLink()}
            typeLabel={getPostTypeLabel()}
            title={post.title}
            createdAt={new Date(post.created_at).toLocaleDateString()}
            viewCount={(post.view_count || 0) + 1}
            extraHeader={
                <PostActions
                    postId={post.id}
                    postUserId={post.user_id}
                    postType={post.type}
                    isPinned={post.is_pinned || false}
                />
            }
        >
            <div
                className="prose prose-xs md:prose-sm max-w-none prose-slate prose-img:rounded-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />
        </PostDetailLayout>
    );
}
