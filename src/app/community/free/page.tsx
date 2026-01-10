import { createServerClient } from "@/lib/supabaseClient";
import FreeBoardClient from "@/app/community/free/FreeBoardClient";

export const dynamic = 'force-dynamic';

export default async function FreeBoardPage() {
    const supabase = createServerClient();

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
