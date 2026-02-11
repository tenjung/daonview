import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { paymentId } = await request.json();

        if (!paymentId) {
            return NextResponse.json({
                success: false,
                message: '결제 ID가 제공되지 않았습니다.',
            }, { status: 400 });
        }

        const apiSecret = process.env.PORTONE_API_SECRET;

        if (!apiSecret) {
            console.error('PORTONE_API_SECRET is not configured');
            return NextResponse.json({
                success: false,
                message: '서버 설정 오류입니다.',
            }, { status: 500 });
        }

        // 포트원 API로 결제 상태 검증
        const response = await fetch(
            `https://api.portone.io/v2/payments/${paymentId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `PortOne ${apiSecret}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('PortOne API error:', errorData);
            return NextResponse.json({
                success: false,
                message: '결제 검증 API 호출 실패',
            }, { status: response.status });
        }

        const payment = await response.json();
        const supabase = await createClient();

        // 사용자 및 캠페인 식별 (customData에서 추출)
        const customData = payment.customData || {};
        const userId = customData.userId;
        const campaignId = customData.campaignId;

        // 결제 데이터 준비 (UPPERCASE_STRING 규칙 준수)
        const paymentRecord = {
            user_id: userId,
            campaign_id: campaignId && campaignId > 0 ? campaignId : null,
            payment_id: paymentId,
            merchant_uid: payment.merchantUid || null,
            amount: payment.amount?.total || 0,
            method: (payment.method?.type || 'CARD').toUpperCase(),
            status: (payment.status || 'PAID').toUpperCase(),
            payment_data: payment,
            receipt_url: payment.receiptUrl || null,
            updated_at: new Date().toISOString()
        };

        // 결제 내역 저장 (Upsert)
        const { error: upsertError } = await supabase
            .from('payments')
            .upsert(paymentRecord, { onConflict: 'payment_id' });

        if (upsertError) {
            console.error('Error saving payment record:', upsertError);
            // 저장은 실패했지만 결제는 완료된 경우이므로 에러를 반환할지 고민 필요
            // 일단 성공으로 반환하되 로그 남김
        }

        // 결제 상태 확인
        if (payment.status === 'PAID') {
            return NextResponse.json({
                success: true,
                payment,
                message: '결제가 정상적으로 완료되었습니다.',
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `결제가 완료되지 않았습니다. 상태: ${payment.status}`,
                payment
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || '결제 검증 중 오류가 발생했습니다.',
        }, { status: 500 });
    }
}
