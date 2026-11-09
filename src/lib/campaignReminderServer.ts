import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { getCampaignGuideContent } from '@/lib/campaignEmailContent';
import { getReminderDeadline, isDefinitiveEmailRejection, isReminderEligible, REMINDER_TYPE } from '@/lib/campaignReminder';
import type { ReminderSource, ReminderStatus } from '@/lib/campaignReminder';

const TABLE = 'campaign_reminder_deliveries';
type AdminClient = ReturnType<typeof createAdminClient>;
type Delivery = { id: number; application_id: number };

export function canSendReminderEmails() {
  const forceSend = ['TRUE', '1', 'YES', 'ON'].includes(String(process.env.EMAIL_FORCE_SEND || '').toUpperCase());
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    && (process.env.NODE_ENV === 'production' || forceSend);
}

/** Only the explicitly requested legacy campaign can be seeded manually. */
export async function enqueueExistingEquviaReminders(admin: AdminClient) {
  const { data, error } = await admin.from('applications')
    .select('id, status, review_submitted').eq('campaign_id', 44).in('status', ['SELECTED', 'APPROVED']);
  if (error) throw error;
  const rows = (data || []).filter(isReminderEligible).map((application) => ({
    application_id: application.id,
    notification_type: REMINDER_TYPE,
    source: 'MANUAL_CAMPAIGN_44',
    due_at: new Date().toISOString(),
  }));
  if (!rows.length) return 0;
  const { data: inserted, error: insertError } = await admin.from(TABLE)
    .upsert(rows, { onConflict: 'application_id,notification_type', ignoreDuplicates: true }).select('id');
  if (insertError) throw insertError;
  return inserted?.length || 0;
}

async function complete(admin: AdminClient, id: number, status: ReminderStatus, reason: string | null, messageId?: string) {
  const { error } = await admin.from(TABLE).update({
    status, reason, message_id: messageId || null, completed_at: new Date().toISOString(),
  }).eq('id', id).eq('status', 'PROCESSING');
  if (error) throw error;
}

export async function runCampaignReminders(admin: AdminClient, source: ReminderSource) {
  const startedAt = Date.now();
  const summary = { checked: 0, claimed: 0, sent: 0, skipped: 0, failed: 0, unknown: 0, mock: 0, staleUnknown: 0, remaining: 0 };
  // A previous process may have died after SES accepted the message. Never re-send it.
  const { data: stale, error: staleError } = await admin.from(TABLE).update({
    status: 'UNKNOWN', reason: 'PROCESS_INTERRUPTED', completed_at: new Date().toISOString(),
  }).eq('status', 'PROCESSING').lt('claimed_at', new Date(startedAt - 15 * 60_000).toISOString()).select('id');
  if (staleError) throw staleError;
  summary.staleUnknown = stale?.length || 0;

  while (Date.now() - startedAt < 45_000) {
    const { data: deliveries, error } = await admin.from(TABLE).select('id, application_id')
      .eq('source', source).eq('status', 'PENDING').lte('due_at', new Date().toISOString())
      .order('due_at').order('id').limit(20);
    if (error) throw error;
    if (!deliveries?.length) break;
    for (const delivery of deliveries as Delivery[]) {
      if (Date.now() - startedAt >= 45_000) break;
      summary.checked++;
      const { data: claimed, error: claimError } = await admin.from(TABLE).update({
        status: 'PROCESSING', claimed_at: new Date().toISOString(),
      }).eq('id', delivery.id).eq('status', 'PENDING').select('id').maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) continue;
      summary.claimed++;
      let sendStarted = false;
      let outcome: { status: ReminderStatus; reason: string | null; messageId?: string };
      try {
        outcome = await prepareAndSend(admin, delivery, source, () => { sendStarted = true; });
      } catch (error) {
        outcome = {
          status: sendStarted && !isDefinitiveEmailRejection(error) ? 'UNKNOWN' : 'FAILED',
          reason: sendStarted ? 'PROVIDER_ERROR' : 'PREPARATION_ERROR',
        };
        console.error('Campaign reminder failed', { deliveryId: delivery.id, status: outcome.status, reason: outcome.reason });
      }
      // If persistence fails after sending, leave PROCESSING for the stale-to-UNKNOWN sweep.
      // Do not put the delivery back into PENDING or attempt another email.
      await complete(admin, delivery.id, outcome.status, outcome.reason, outcome.messageId);
      if (outcome.status === 'SENT') summary.sent++;
      else if (outcome.status === 'SKIPPED') summary.skipped++;
      else if (outcome.status === 'UNKNOWN') summary.unknown++;
      else summary.failed++;
      if (outcome.reason === 'MOCK_NOT_SENT') summary.mock++;
    }
  }
  const { count, error: countError } = await admin.from(TABLE).select('id', { count: 'exact', head: true })
    .eq('source', source).eq('status', 'PENDING').lte('due_at', new Date().toISOString());
  if (countError) throw countError;
  summary.remaining = count || 0;
  return summary;
}

async function prepareAndSend(admin: AdminClient, delivery: Delivery, source: ReminderSource, beforeSend: () => void): Promise<{
  status: ReminderStatus; reason: string | null; messageId?: string;
}> {
  const { data: application, error } = await admin.from('applications')
    .select('id, campaign_id, user_id, status, review_submitted, review_deadline')
    .eq('id', delivery.application_id).maybeSingle();
  if (error) throw error;
  if (!application || !isReminderEligible(application)) return { status: 'SKIPPED', reason: 'NO_LONGER_ELIGIBLE' };
  if (source === 'MANUAL_CAMPAIGN_44' && application.campaign_id !== 44) return { status: 'SKIPPED', reason: 'WRONG_CAMPAIGN' };
  if (!application.user_id || !application.campaign_id) return { status: 'SKIPPED', reason: 'MISSING_RECIPIENT_OR_CAMPAIGN' };
  const [profileResult, campaignResult, reviewsResult] = await Promise.all([
    admin.from('profiles').select('email, nickname, name').eq('id', application.user_id).maybeSingle(),
    admin.from('campaigns').select('id, title, status, product_name, experience_details, campaign_options').eq('id', application.campaign_id).maybeSingle(),
    admin.from('reviews').select('id').eq('user_id', application.user_id).eq('campaign_id', application.campaign_id).limit(1),
  ]);
  if (profileResult.error || campaignResult.error || reviewsResult.error) throw new Error('Reminder data lookup failed');
  if (reviewsResult.data?.length) return { status: 'SKIPPED', reason: 'REVIEW_EXISTS' };
  const profile = profileResult.data;
  const campaign = campaignResult.data;
  if (!profile?.email?.trim()) return { status: 'SKIPPED', reason: 'MISSING_EMAIL' };
  if (!campaign) return { status: 'FAILED', reason: 'MISSING_CAMPAIGN' };
  if (['CANCELLED', 'REJECTED', 'DRAFT', 'COMPLETED'].includes(String(campaign.status || '').toUpperCase())) {
    return { status: 'SKIPPED', reason: 'CAMPAIGN_ENDED' };
  }
  const { data: latest, error: latestError } = await admin.from('applications')
    .select('status, review_submitted, review_deadline').eq('id', application.id).maybeSingle();
  if (latestError) throw latestError;
  if (!latest || !isReminderEligible(latest)) return { status: 'SKIPPED', reason: 'NO_LONGER_ELIGIBLE' };
  beforeSend();
  const result = await sendEmail(profile.email.trim(), REMINDER_TYPE, {
    nickname: profile.nickname || profile.name || '인플루언서', campaignTitle: campaign.title,
    providedItems: campaign.experience_details || campaign.product_name || '캠페인 상세 페이지 참조',
    campaignUrl: `https://daonview.com/campaigns/${campaign.id}#guide`,
    ...getCampaignGuideContent(campaign.campaign_options),
    ...getReminderDeadline(latest.review_deadline, campaign.campaign_options),
  });
  if (result.mock) return { status: 'FAILED', reason: 'MOCK_NOT_SENT' };
  if (!result.success) return { status: result.skipped ? 'SKIPPED' : 'FAILED', reason: result.skipped ? 'EMAIL_SUPPRESSED' : 'EMAIL_POLICY_LOOKUP_FAILED' };
  if (!result.messageId) return { status: 'UNKNOWN', reason: 'MISSING_PROVIDER_ID' };
  return { status: 'SENT', reason: null, messageId: result.messageId };
}
