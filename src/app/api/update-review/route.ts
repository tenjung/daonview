import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 사이드 Supabase 클라이언트 (서비스 롤 키 사용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const { reviewId, data } = await request.json();

        if (!reviewId || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 관리자 권한으로 업데이트
        const { error } = await supabaseAdmin
            .from('reviews')
            .update({
                title: data.title,
                description: data.description,
                thumbnail_url: data.thumbnail,
                author_name: data.authorName
            })
            .eq('id', reviewId);

        if (error) {
            console.error('Update error:', error);
            throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error updating review:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update review' },
            { status: 500 }
        );
    }
}
