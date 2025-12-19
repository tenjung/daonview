import { supabase } from "@/lib/supabaseClient";
import EventBoardClient from "./EventBoardClient";

export const dynamic = 'force-dynamic';

export default async function EventPage() {
    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('type', '이벤트')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching events:', error);
        return <div>이벤트를 불러오는 중 오류가 발생했습니다.</div>;
    }

    return <EventBoardClient initialPosts={data || []} />;
}

