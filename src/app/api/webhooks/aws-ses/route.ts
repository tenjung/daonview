import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeSESFeedback } from '@/lib/emailFeedback';
import { SNSCertificateUnavailable, verifySNSMessage } from '@/lib/snsVerification';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const topic = process.env.AWS_SES_FEEDBACK_TOPIC_ARN;
  if (!topic) return NextResponse.json({ error: 'Feedback collection is not configured.' }, { status: 503 });
  let envelope;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > 256000) return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
    envelope = await verifySNSMessage(JSON.parse(text), topic);
  } catch (error) {
    if (error instanceof SNSCertificateUnavailable) return NextResponse.json({ error: 'Certificate service unavailable.' }, { status: 503 });
    return NextResponse.json({ error: 'Invalid SNS notification.' }, { status: 400 });
  }
  try {
    if (envelope.Type === 'SubscriptionConfirmation') {
      const response = await fetch(envelope.SubscribeURL!, { redirect: 'error', signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Subscription confirmation failed');
      return NextResponse.json({ success: true });
    }
    let events;
    try {
      events = normalizeSESFeedback(JSON.parse(envelope.Message), process.env.EMAIL_FROM || 'master@daonview.com');
    } catch {
      return NextResponse.json({ error: 'Invalid SES feedback.' }, { status: 400 });
    }
    const admin = createAdminClient();
    for (const event of events) {
      const { error } = await admin.rpc('record_email_feedback', { p_event: event });
      if (error) throw new Error('Feedback persistence failed');
    }
    return NextResponse.json({ success: true, processed: events.length });
  } catch {
    console.error('SES feedback persistence or subscription failed');
    return NextResponse.json({ error: 'Feedback processing failed.' }, { status: 500 });
  }
}
