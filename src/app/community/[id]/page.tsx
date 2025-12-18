import { supabase } from "@/lib/supabaseClient";
import PostDetailClient from "./PostDetailClient";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        // 1. Fetch Post
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (postError || !postData) {
            return (
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold text-gray-400 mb-4">게시글을 찾을 수 없습니다.</h1>
                    <Link href="/community/free" className="btn btn-primary">목록으로 돌아가기</Link>
                </div>
            );
        }

        // 2. Fetch Author Profile
        if (postData.user_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('nickname, name')
                .eq('id', postData.user_id)
                .single();
            postData.profiles = profile;
        }

        // 3. Fetch Comments
        const { data: commentsData } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', id)
            .order('created_at', { ascending: true });

        let combinedComments: any[] = [];
        if (commentsData && commentsData.length > 0) {
            const userIds = Array.from(new Set(commentsData.map(c => c.user_id)));
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, nickname, name')
                .in('id', userIds);

            const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
                acc[p.id] = p;
                return acc;
            }, {});

            combinedComments = commentsData.map(c => ({
                ...c,
                profiles: profilesMap[c.user_id] || null
            }));
        }

        return (
            <PostDetailClient
                initialPost={postData}
                initialComments={combinedComments}
                id={id}
            />
        );
    } catch (error) {
        console.error('Error in PostDetailPage:', error);
        return <div>오류가 발생했습니다.</div>;
    }
}

