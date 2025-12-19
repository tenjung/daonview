import { createServerClient } from "@/lib/supabaseClient";
import BlogIntroClient from "./BlogIntroClient";

export const dynamic = 'force-dynamic';

export default async function BlogIntroPage() {
    const supabase = createServerClient();
    
    // Fetch blog intro posts
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'BLOG_INTRO')
        .order('created_at', { ascending: false });

    if (error) {
        // Silently handle error - this is expected in Server Components
    }

    return <BlogIntroClient initialPosts={posts || []} />;
}
