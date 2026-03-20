import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * AWS SES Feedback Loop Webhook Handler
 * AWS SNS를 통해 Bounce(반송) 및 Complaint(신고) 통보를 받아 유저 상태를 업데이트합니다.
 * 이 코드는 AWS SES 승인 심사 시 "반송 관리 로직"의 핵심 증거가 됩니다.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. AWS SNS 구독 확인 처리 (최초 설정 시 필요)
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('SNS Subscription Confirmation:', body.SubscribeURL);
      // 브라우저에서 body.SubscribeURL을 실행하거나 아래와 같이 GET 요청을 보낼 수 있음
      await fetch(body.SubscribeURL);
      return NextResponse.json({ success: true, message: 'Subscribed' });
    }

    // 2. 실제 알림 처리
    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message);
      const notificationType = message.notificationType; // 'Bounce', 'Complaint', 'Delivery'
      
      const supabase = createAdminClient();

      if (notificationType === 'Bounce') {
        const bounce = message.bounce;
        const bouncedRecipients = bounce.bouncedRecipients; // 반송된 수신자 목록

        for (const recipient of bouncedRecipients) {
          const email = recipient.emailAddress;
          console.log(`[AWS SES] Hard Bounce detected: ${email}`);
          
          // DB 상태 업데이트: 해당 이메일의 수신 상태를 'BOUNCED'로 변경
          await supabase
            .from('profiles')
            .update({ email_subscription_status: 'BOUNCED' })
            .eq('email', recipient.emailAddress);
        }
      }

      if (notificationType === 'Complaint') {
        const complaint = message.complaint;
        const complainedRecipients = complaint.complainedRecipients;

        for (const recipient of complainedRecipients) {
          const email = recipient.emailAddress;
          console.log(`[AWS SES] Complaint detected: ${email}`);
          
          // DB 상태 업데이트: 해당 이메일의 수신 상태를 'COMPLAINED'로 변경
          await supabase
            .from('profiles')
            .update({ email_subscription_status: 'COMPLAINED' })
            .eq('email', recipient.emailAddress);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SES Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
