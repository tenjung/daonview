import { createClient as createServerClient } from "@/lib/supabase/server";
import FreeBoardClient from "@/app/community/free/FreeBoardClient";

export const revalidate = 60;

export default async function FeedbackBoardPage() {
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
        console.error('Error fetching feedback posts:', error);
    }

    return <FreeBoardClient initialPosts={posts || []} />;
}

