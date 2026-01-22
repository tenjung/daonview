import { createClient as createServerClient } from "@/lib/supabase/server";
import BlogIntroClient from "./BlogIntroClient";

export const revalidate = 60; // ISR: 1분마다 재생성


export default async function BlogIntroPage() {
    const supabase = await createServerClient();
    
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
