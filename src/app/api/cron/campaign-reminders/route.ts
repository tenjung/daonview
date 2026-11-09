import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canSendReminderEmails, enqueueExistingEquviaReminders, runCampaignReminders } from '@/lib/campaignReminderServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function checkAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cron is not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canSendReminderEmails()) return NextResponse.json({ error: 'Real email sending is not configured.' }, { status: 503 });
}

export async function GET(request: Request) {
  const rejection = checkAuthorization(request);
  if (rejection) return rejection;
  try {
    const result = await runCampaignReminders(createAdminClient(), 'AUTOMATIC');
    return NextResponse.json({ success: true, ...result });
  } catch {
    console.error('Campaign reminder cron failed');
    return NextResponse.json({ error: 'Reminder processing failed. Check delivery records before retrying.' }, { status: 500 });
  }
}

/** Authorized one-time legacy send; this endpoint cannot target other campaigns. */
export async function POST(request: Request) {
  const rejection = checkAuthorization(request);
  if (rejection) return rejection;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('campaignId' in body) || body.campaignId !== 44) {
    return NextResponse.json({ error: 'Only campaign 44 is allowed.' }, { status: 400 });
  }
  try {
    const admin = createAdminClient();
    const enqueued = await enqueueExistingEquviaReminders(admin);
    const result = await runCampaignReminders(admin, 'MANUAL_CAMPAIGN_44');
    return NextResponse.json({ success: true, enqueued, ...result });
  } catch {
    console.error('Legacy campaign reminder send failed');
    return NextResponse.json({ error: 'Reminder processing failed. Check delivery records before retrying.' }, { status: 500 });
  }
}
