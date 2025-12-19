import { createServerClient } from "@/lib/supabaseClient";
import FreeBoardClient from "./FreeBoardClient";

export const dynamic = 'force-dynamic';

export default async function FreeBoardPage() {
    const supabase = createServerClient();
    
    // Fetch free board posts
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'FREE')
        .order('created_at', { ascending: false });

    if (error) {
        // Silently handle error - this is expected in Server Components
    }

    return <FreeBoardClient initialPosts={posts || []} />;
}
