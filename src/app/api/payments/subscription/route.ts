import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { billingKey, userId, planMonths, totalAmount } = await request.json();

        if (!billingKey || !userId || !planMonths || !totalAmount) {
            return NextResponse.json({
                success: false,
                message: '결제에 필요한 필수 파라미터가 누락되었습니다.',
            }, { status: 400 });
        }

        const apiSecret = process.env.PORTONE_SUBSCRIPTION_API_SECRET;

        if (!apiSecret) {
            console.error('PORTONE_SUBSCRIPTION_API_SECRET 설정 누락');
            return NextResponse.json({
                success: false,
                message: '서버 설정 오류입니다.',
            }, { status: 500 });
        }

        // 첫 달 결제 ID (고유한 상점 주문번호)
        const paymentId = `sub_${userId.replace(/-/g, '').substring(0, 8)}_${Date.now()}`;

        // 포트원 V2 가이드 기준: /payments/{paymentId}/billing-key
        const portOneResponse = await fetch(
            `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `PortOne ${apiSecret}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    billingKey,
                    orderName: `다온뷰 무제한 월 이용권`,
                    amount: {
                        total: totalAmount,
                    },
                    currency: 'KRW',
                    customer: {
                        id: userId,
                    },
                })
            }
        );

        if (!portOneResponse.ok) {
            const errorData = await portOneResponse.json();
            console.error('PortOne billing-key payment error:', errorData);
            return NextResponse.json({
                success: false,
                message: errorData.message || '빌링키를 이용한 결제 승인에 실패했습니다.',
            }, { status: portOneResponse.status });
        }

        const payment = await portOneResponse.json();
        const supabase = await createClient();

        // payments 테이블에 첫 달 결제 내역 저장
        const paymentRecord = {
            user_id: userId,
            campaign_id: null,
            payment_id: paymentId,
            merchant_uid: payment.merchantUid || null,
            amount: payment.amount?.total || totalAmount,
            method: (payment.method?.type || 'CARD').toUpperCase(),
            status: (payment.status || 'PAID').toUpperCase(),
            payment_data: {
                ...payment,
                billingKey,
            },
            receipt_url: payment.receiptUrl || null,
            updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabase
            .from('payments')
            .upsert(paymentRecord, { onConflict: 'payment_id' });

        if (upsertError) {
            console.error('Error saving payment record:', upsertError);
        }

        if (payment.status === 'PAID') {
            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setMonth(now.getMonth() + 1); // 월간 정기결제: 항상 1개월 단위

            // subscriptions 테이블에 구독 상태 저장 (billingKey 포함으로 다음 결제에도 활용 가능)
            const subscriptionRecord = {
                user_id: userId,
                plan: `1개월`,
                status: 'ACTIVE',
                amount: totalAmount,
                starts_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                payment_id: paymentId,
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
            };

            const { error: subscriptionError } = await supabase
                .from('subscriptions')
                .upsert(subscriptionRecord, { onConflict: 'user_id' });

            if (subscriptionError) {
                console.error('Error saving subscription record:', subscriptionError);
            }

            // 다음 달 결제 예약 (포트원 V2 가이드: /payments/{id}/schedule)
            const nextPaymentId = `sub_${userId.replace(/-/g, '').substring(0, 8)}_${Date.now() + 1}`;
            const nextPayDate = new Date(expiresAt); // 구독 만료일에 재결제

            const scheduleResponse = await fetch(
                `https://api.portone.io/payments/${encodeURIComponent(nextPaymentId)}/schedule`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `PortOne ${apiSecret}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payment: {
                            billingKey,
                            orderName: `다온뷰 무제한 월 이용권`,
                            customer: {
                                id: userId,
                            },
                            amount: {
                                total: totalAmount,
                            },
                            currency: 'KRW',
                        },
                        timeToPay: nextPayDate.toISOString(),
                    })
                }
            );

            if (!scheduleResponse.ok) {
                const scheduleError = await scheduleResponse.json();
                console.error('PortOne schedule error:', scheduleError);
                // 예약 실패는 치명적이지 않으므로 결제는 성공으로 반환
            } else {
                console.log('다음 달 결제 예약 완료:', nextPayDate.toISOString());
            }

            return NextResponse.json({
                success: true,
                payment,
                message: '정기결제가 승인되었습니다.',
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `결제가 완료되지 않았습니다. 상태: ${payment.status}`,
                payment
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Subscription API error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || '서버 오류가 발생했습니다.',
        }, { status: 500 });
    }
}
