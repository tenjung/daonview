import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PostDetailLayout from '@/components/community/PostDetailLayout';

interface PageProps {
    params: Promise<{ id: string }>;
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
