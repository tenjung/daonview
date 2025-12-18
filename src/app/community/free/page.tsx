import { supabase } from "@/lib/supabaseClient";
import FreeBoardClient from "./FreeBoardClient";

export const dynamic = 'force-dynamic';

export default async function FreeBoardPage() {
    // 1. 게시글 목록 먼저 가져오기 (조인 없이)
    const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'FREE')
        .order('created_at', { ascending: false });

    if (postsError) {
        console.error('Error fetching posts:', postsError);
        return <div>오류가 발생했습니다.</div>;
    }

    if (!postsData || postsData.length === 0) {
        return <FreeBoardClient initialPosts={[]} />;
    }

    // 2. 작성자 ID 목록 추출
    const userIds = Array.from(new Set(postsData.map(post => post.user_id)));

    // 3. 해당 작성자들의 프로필 정보 한꺼번에 가져오기
    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, name')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // 프로필을 못 가져와도 글 목록은 보여줌
        return <FreeBoardClient initialPosts={postsData} />;
    }

    // 4. 데이터 합치기
    const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
    }, {});

    const combinedData = postsData.map(post => ({
        ...post,
        profiles: profilesMap[post.user_id] || null
    }));

    return <FreeBoardClient initialPosts={combinedData} />;
}


