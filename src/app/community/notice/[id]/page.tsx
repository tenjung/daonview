import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PostDetailLayout from '@/components/community/PostDetailLayout';
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;

    const { data: notice } = await supabase
        .from('notices')
        .select('title, content')
        .eq('id', id)
        .single();

    if (!notice) return {};

    const title = notice.title;
    // HTML 태그 제거 및 160자 제한
    const description = notice.content.replace(/<[^>]*>?/gm, '').substring(0, 160);

    return {
        title: `${title} | 다온뷰 커뮤니티`,
        description: description,
        alternates: {
            canonical: `/community/notice/${id}`,
        },
        openGraph: {
            title: title,
            description: description,
            url: `https://daonview.com/community/notice/${id}`,
            type: 'article',
        }
    };
}

export default async function NoticeDetailPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch notice data
    const { data: notice, error } = await supabase
        .from('notices')
        .select('*, profiles(nickname)')
        .eq('id', id)
        .single();

    if (error || !notice) return notFound();

    // Increment view count
    await supabase.rpc('increment_notice_view_count', { notice_id: id });

    const authorName = (notice as any).profiles?.nickname || '관리자';

    return (
        <PostDetailLayout
            backLink="/community/notice"
            typeLabel={notice.type}
            typeColor={notice.type === '이벤트' ? 'bg-orange-50 text-orange-500 border-orange-100' : undefined}
            isPinned={notice.is_pinned}
            title={notice.title}
            author={authorName}
            createdAt={new Date(notice.created_at).toLocaleDateString()}
            viewCount={(notice.view_count || 0) + 1}
        >
            <div
                className="prose prose-xs md:prose-sm max-w-none prose-slate prose-img:rounded-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: notice.content }}
            />
        </PostDetailLayout>
    );
}
