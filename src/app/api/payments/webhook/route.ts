import { NextResponse } from 'next/server';
import * as PortOne from '@portone/server-sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncPortOnePayment } from '@/lib/payments/portone';

const extractPaymentId = (webhook: PortOne.Webhook.Webhook) => {
  if (PortOne.Webhook.isUnrecognizedWebhook(webhook)) {
    return null;
  }

  switch (webhook.type) {
    case 'Transaction.Paid':
    case 'Transaction.Failed':
    case 'Transaction.PayPending':
    case 'Transaction.Ready':
    case 'Transaction.VirtualAccountIssued':
    case 'Transaction.CancelPending':
    case 'Transaction.Cancelled':
    case 'Transaction.PartialCancelled':
    case 'Transaction.Confirm':
    case 'Transaction.DisputeCreated':
    case 'Transaction.DisputeResolved':
      return webhook.data.paymentId;
    default:
      return null;
  }
};

export async function POST(request: Request) {
  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('PORTONE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { success: false, message: '서버 설정 오류입니다.' },
      { status: 500 }
    );
  }

  try {
    const payload = await request.text();
    const webhook = await PortOne.Webhook.verify(
      webhookSecret,
      payload,
      Object.fromEntries(request.headers.entries())
    );

    const paymentId = extractPaymentId(webhook);

    if (!paymentId) {
      return NextResponse.json({
        success: true,
        message: '결제 동기화 대상이 아닌 웹훅입니다.',
      });
    }

    const supabase = createAdminClient();
    const { payment, status } = await syncPortOnePayment(supabase, paymentId);

    return NextResponse.json({
      success: true,
      paymentId,
      status,
      payment,
    });
  } catch (error) {
    if (error instanceof PortOne.Webhook.WebhookVerificationError) {
      console.error('PortOne webhook verification error:', error.reason);
      return NextResponse.json(
        {
          success: false,
          message: '유효하지 않은 웹훅 요청입니다.',
          reason: error.reason,
        },
        { status: 401 }
      );
    }

    console.error('PortOne webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '웹훅 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
