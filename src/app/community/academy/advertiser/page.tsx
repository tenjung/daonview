import { createClient as createServerClient } from "@/lib/supabase/server";
import AdvertiserColumnClient from "./AdvertiserColumnClient";

export const revalidate = 60; // ISR: 1분마다 재생성


export default async function AdvertiserColumnPage() {
    const supabase = await createServerClient();

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
