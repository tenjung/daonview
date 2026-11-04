import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { coerceDashboardRole } from '@/constants/role';
import { ACTIVE_CAMPAIGN_STATUSES, SELECTED_APPLICATION_STATUSES } from '@/constants/campaign';

const WITHDRAWAL_TITLE = '[ACCOUNT_WITHDRAWAL] 회원탈퇴 요청';
const WITHDRAWAL_BAN_DURATION = '876000h';

function getWithdrawalInquiryId(userId: string) {
    // Give concurrent submissions for the same account a shared inquiry ID.
    const hash = createHash('sha256').update(`account-withdrawal:${userId}`).digest('hex');
    return [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20, 32)].join('-');
}

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

        const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
        if (contentType !== 'application/json') {
            return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.' }, { status: 415 });
        }

        const body = await request.json().catch(() => ({}));
        if (body?.confirmation !== '회원탈퇴' || body?.agreed !== true) {
            return NextResponse.json({ success: false, error: '탈퇴 확인 문구와 동의가 필요합니다.' }, { status: 400 });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) throw profileError;
        const role = coerceDashboardRole(profile?.role || user.user_metadata?.role);
        if (role !== 'INFLUENCER' && role !== 'ADVERTISER') {
            return NextResponse.json({ success: false, error: '이 계정은 직접 탈퇴할 수 없습니다.' }, { status: 403 });
        }

        const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
        const admin = createAdminClient();
        const [applications, reviews, campaigns] = await Promise.all([
            admin.from('applications').select('id').eq('user_id', user.id)
                .in('status', ['PENDING', ...SELECTED_APPLICATION_STATUSES]).limit(1),
            admin.from('reviews').select('id').eq('user_id', user.id)
                .eq('status', 'PENDING').limit(1),
            admin.from('campaigns').select('id').eq('created_by', user.id)
                .in('status', ['PENDING', ...ACTIVE_CAMPAIGN_STATUSES]).limit(1),
        ]);

        const eligibilityError = applications.error ?? reviews.error ?? campaigns.error;
        if (eligibilityError) throw eligibilityError;

        if (applications.data?.length || reviews.data?.length || campaigns.data?.length) {
            return NextResponse.json({
                success: false,
                error: '신청 심사 중이거나 진행·검수 중인 캠페인이 있어 탈퇴할 수 없습니다. 남은 절차를 완료하거나 취소한 후 다시 요청해 주세요.',
            }, { status: 409 });
        }

        const { data: latest, error: latestError } = await admin
            .from('inquiries')
            .select('status')
            .eq('user_id', user.id)
            .eq('title', WITHDRAWAL_TITLE)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latestError) throw latestError;

        if (latest?.status?.toUpperCase() !== 'PENDING') {
            const contentLines = [
                '회원탈퇴 요청이 접수되었습니다.',
                '',
                `USER_ID: ${user.id}`,
                `EMAIL: ${user.email ?? 'UNKNOWN'}`,
                `REQUESTED_AT: ${new Date().toISOString()}`,
            ];

            if (reason) contentLines.push('', `REASON: ${reason}`);

            const { error: insertError } = await admin.from('inquiries').upsert({
                id: getWithdrawalInquiryId(user.id),
                user_id: user.id,
                category: 'EXPERIENCE',
                title: WITHDRAWAL_TITLE,
                content: contentLines.join('\n'),
                status: 'PENDING',
            }, { onConflict: 'id', ignoreDuplicates: true });

            if (insertError) throw insertError;
        }

        const { error: banError } = await admin.auth.admin.updateUserById(user.id, {
            ban_duration: WITHDRAWAL_BAN_DURATION,
        });

        if (banError) {
            console.error('[AccountWithdrawal] Could not block account sign-in:', banError.code);
            return NextResponse.json({
                success: false,
                error: '탈퇴 요청은 접수됐지만 로그인 차단에 실패했습니다. 다시 시도해 주세요.',
            }, { status: 502 });
        }

        return NextResponse.json({ success: true, status: 'ACCESS_BLOCKED' });
    } catch (error: unknown) {
        console.error('[AccountWithdrawal] Request processing failed:', error);
        return NextResponse.json({ success: false, error: '탈퇴 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
