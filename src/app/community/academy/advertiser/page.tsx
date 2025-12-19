import { createServerClient } from "@/lib/supabaseClient";
import AdvertiserColumnClient from "./AdvertiserColumnClient";

export const dynamic = 'force-dynamic';

export default async function AdvertiserColumnPage() {
    const supabase = createServerClient();
    
    // Fetch advertiser columns from posts table
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'ACADEMY_ADVERTISER')
        .order('created_at', { ascending: false });

    // Debug logging
    console.log('=== ADVERTISER COLUMN DEBUG ===');
    console.log('Posts data:', posts);
    console.log('Posts count:', posts?.length || 0);
    console.log('Error:', error);
    console.log('================================');

    if (error) {
        console.error('Supabase error details:', error);
    }

    return <AdvertiserColumnClient initialPosts={posts || []} />;
}
