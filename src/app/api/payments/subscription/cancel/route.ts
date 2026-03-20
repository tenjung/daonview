import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: '사용자 ID가 없습니다.' }, { status: 400 });
        }

        const apiSecret = process.env.PORTONE_SUBSCRIPTION_API_SECRET;
        if (!apiSecret) {
            return NextResponse.json({ success: false, message: '서버 설정 오류입니다.' }, { status: 500 });
        }

        const supabase = await createClient();

        // 현재 ACTIVE 구독 정보 조회
        const { data: subscription, error: fetchError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'ACTIVE')
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError || !subscription) {
            return NextResponse.json({ success: false, message: '활성 구독이 없습니다.' }, { status: 404 });
        }

        // 포트원 예약결제 조회 후 취소
        // billing_key는 payment_data에 저장되어 있으므로 payments 테이블에서 조회
        const { data: paymentData } = await supabase
            .from('payments')
            .select('payment_data')
            .eq('payment_id', subscription.payment_id)
            .maybeSingle();

        // 예약된 다음 결제가 있다면 취소 시도 (포트원 예약결제 목록에서 billingKey로 조회)
        if (paymentData?.payment_data?.billingKey) {
            const billingKey = paymentData.payment_data.billingKey;

            // 포트원 빌링키에 연결된 예약결제 목록 조회
            const schedulesRes = await fetch(
                `https://api.portone.io/schedules?billingKey=${encodeURIComponent(billingKey)}&status=SCHEDULED`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `PortOne ${apiSecret}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (schedulesRes.ok) {
                const schedulesData = await schedulesRes.json();
                const schedules = schedulesData.items ?? schedulesData.schedules ?? [];

                // 예약된 결제 모두 취소
                for (const schedule of schedules) {
                    const scheduleId = schedule.scheduleId ?? schedule.id;
                    if (scheduleId) {
                        await fetch(
                            `https://api.portone.io/schedules/${encodeURIComponent(scheduleId)}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `PortOne ${apiSecret}`,
                                },
                            }
                        );
                    }
                }
            }
        }

        // DB: subscriptions 상태를 CANCELLED로 업데이트 (expires_at은 유지)
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'CANCELLED',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

        if (updateError) {
            console.error('Error updating subscription:', updateError);
            return NextResponse.json({ success: false, message: '구독 해지 처리 중 오류가 발생했습니다.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: '구독이 해지되었습니다.',
            expiresAt: subscription.expires_at,
        });

    } catch (error: any) {
        console.error('Subscription cancel error:', error);
        return NextResponse.json({ success: false, message: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
