import { createClient as createServerClient } from "@/lib/supabase/server";
import AcademyBoardClient from "@/app/community/academy/AcademyBoardClient";

export const revalidate = 60; // ISR: 1분마다 재생성


export default async function AcademyPage() {
    const supabase = await createServerClient();

    // posts 테이블에서 아카데미 관련 게시글 조회
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles (
                id,
                nickname,
                name
            )
        `)
        .or('type.ilike.%ACADEMY%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching academy posts:', error);
    }

    return <AcademyBoardClient initialPosts={posts || []} />;
}
