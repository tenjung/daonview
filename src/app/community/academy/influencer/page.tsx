import { createServerClient } from "@/lib/supabaseClient";
import InfluencerColumnClient from "./InfluencerColumnClient";

export const dynamic = 'force-dynamic';

export default async function InfluencerColumnPage() {
    const supabase = createServerClient();
    
    // Fetch influencer columns from posts table
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'ACADEMY_INFLUENCER')
        .order('created_at', { ascending: false });

    if (error) {
        // Silently handle error - this is expected in Server Components
    }

    return <InfluencerColumnClient initialPosts={posts || []} />;
}
