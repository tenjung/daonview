import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncPortOnePayment } from '@/lib/payments/portone';

export async function POST(request: Request) {
    try {
        const { paymentId } = await request.json();

        if (!paymentId) {
            return NextResponse.json({
                success: false,
                message: '결제 ID가 제공되지 않았습니다.',
            }, { status: 400 });
        }

        const supabase = await createClient();
        const { payment, status } = await syncPortOnePayment(supabase, paymentId);

        // 결제 상태 확인
        if (status === 'PAID') {
            return NextResponse.json({
                success: true,
                payment,
                message: '결제가 정상적으로 완료되었습니다.',
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `결제가 완료되지 않았습니다. 상태: ${status}`,
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
