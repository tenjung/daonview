import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const { reviewId, status } = await request.json();

        if (!reviewId || !status) {
            return NextResponse.json({ 
                error: 'reviewId and status are required' 
            }, { status: 400 });
        }

        // 허용된 상태 값 검증
        const allowedStatuses = ['APPROVED', 'HIDDEN', 'PENDING', 'REJECTED'];
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json({ 
                error: 'Invalid status value' 
            }, { status: 400 });
        }

        // 리뷰 상태 업데이트
        const { data, error } = await supabaseAdmin
            .from('reviews')
            .update({ 
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', reviewId)
            .select()
            .single();

        if (error) {
            console.error('Error updating review status:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error: any) {
        console.error('Hide review error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update review status' },
            { status: 500 }
        );
    }
}
