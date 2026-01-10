import { createServerClient } from "@/lib/supabaseClient";
import InfluencerColumnClient from "./InfluencerColumnClient";

export const dynamic = 'force-dynamic';

export default async function InfluencerColumnPage() {
    const supabase = createServerClient();

    // Fetch influencer columns from posts table with profiles join
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
        .eq('type', 'ACADEMY_INFLUENCER')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching influencer posts:', error);
    }

    return <InfluencerColumnClient initialPosts={posts || []} />;
}
