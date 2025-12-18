import { supabase } from "@/lib/supabaseClient";
import NoticeBoardClient from "./NoticeBoardClient";

export const dynamic = 'force-dynamic';

export default async function NoticePage() {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'NOTICE')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notices:', error);
        return <div>공지사항을 불러오는 중 오류가 발생했습니다.</div>;
    }

    return <NoticeBoardClient initialPosts={data || []} />;
}

