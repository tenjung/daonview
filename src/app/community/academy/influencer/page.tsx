import { createClient as createServerClient } from "@/lib/supabase/server";
import InfluencerColumnClient from "./InfluencerColumnClient";

export const revalidate = 60; // ISR: 1분마다 재생성


export default async function InfluencerColumnPage() {
    const supabase = await createServerClient();

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
