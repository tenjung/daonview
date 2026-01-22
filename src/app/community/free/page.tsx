import { createClient as createServerClient } from "@/lib/supabase/server";
import FreeBoardClient from "@/app/community/free/FreeBoardClient";

export const revalidate = 60; // ISR: 1분마다 재생성


export default async function FreeBoardPage() {
    const supabase = await createServerClient();

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
        .eq('type', 'FREE')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching free posts:', error);
    }

    return <FreeBoardClient initialPosts={posts || []} />;
}
