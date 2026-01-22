import { createClient as createServerClient } from "@/lib/supabase/server";
import EventBoardClient from "@/app/community/event/EventBoardClient";

export const revalidate = 300; // ISR: 5분마다 재생성


export default async function EventPage() {
    const supabase = await createServerClient();

    // notices 테이블 사용 및 타입 '이벤트' 조회
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
        .eq('type', '이벤트')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching event posts:', error);
    }

    return <EventBoardClient initialPosts={posts || []} />;
}
