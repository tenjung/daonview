import { createServerClient } from "@/lib/supabaseClient";
import NoticeBoardClient from "@/app/community/notice/NoticeBoardClient";

export const dynamic = 'force-dynamic';

export default async function NoticePage() {
    const supabase = createServerClient();

    // notices 테이블 사용 및 타입 '공지' 조회
    const { data: posts, error } = await supabase
        .from('notices')
        .select(`
            *,
            profiles (
                id,
                nickname,
                name
            )
        `)
        .eq('type', '공지')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notice posts:', error);
    }

    return <NoticeBoardClient initialPosts={posts || []} />;
}
