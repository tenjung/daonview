import { createServerClient } from "@/lib/supabaseClient";
import AdvertiserColumnClient from "./AdvertiserColumnClient";

export const dynamic = 'force-dynamic';

export default async function AdvertiserColumnPage() {
    const supabase = createServerClient();

    // Fetch advertiser columns from posts table with profiles join
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
        .eq('type', 'ACADEMY_ADVERTISER')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching advertiser posts:', error);
    }

    return <AdvertiserColumnClient initialPosts={posts || []} />;
}
