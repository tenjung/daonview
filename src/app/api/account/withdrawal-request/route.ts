import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const WITHDRAWAL_TITLE = '[ACCOUNT_WITHDRAWAL] 회원탈퇴 요청';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

        const { data: latest, error: latestError } = await supabase
            .from('inquiries')
            .select('id, status, created_at')
            .eq('user_id', user.id)
            .eq('title', WITHDRAWAL_TITLE)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latestError) {
            return NextResponse.json({ success: false, error: latestError.message }, { status: 400 });
        }

        if (latest && String(latest.status || '').toUpperCase() === 'PENDING') {
            return NextResponse.json({ success: false, error: '이미 처리 대기 중인 회원탈퇴 요청이 있습니다.' }, { status: 409 });
        }

        const contentLines = [
            '회원탈퇴 요청이 접수되었습니다.',
            '',
            `USER_ID: ${user.id}`,
            `EMAIL: ${user.email ?? 'UNKNOWN'}`,
            `REQUESTED_AT: ${new Date().toISOString()}`,
        ];

        if (reason) {
            contentLines.push('', `REASON: ${reason}`);
        }

        const { error: insertError } = await supabase.from('inquiries').insert({
            user_id: user.id,
            category: 'EXPERIENCE',
            title: WITHDRAWAL_TITLE,
            content: contentLines.join('\n'),
            status: 'PENDING',
        });

        if (insertError) {
            return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
