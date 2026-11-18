// Explicit reviewed mappings only; dry-run by default. No fuzzy campaign/email matching.
import fs from 'node:fs';
import dotenv from 'dotenv';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const file = process.argv[2];
if (!file || file.startsWith('--')) throw new Error('Usage: node scripts/import-selection-email-holds.mjs <reviewed-mappings.json> [--apply]');
const mappings = z.array(z.object({ applicationId: z.number().int().positive(), campaignId: z.number().int().positive(), eventKey: z.string().regex(/^[a-f0-9]{64}$/) })).min(1).max(1000).parse(JSON.parse(fs.readFileSync(file, 'utf8')));
if (new Set(mappings.map(x => x.applicationId)).size !== mappings.length) throw new Error('Select exactly one reviewed latest bounce per application');
dotenv.config({ path: '.env.local', quiet: true });
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname !== 'whpyftpktolpaspeuocg.supabase.co') throw new Error('Unexpected database target');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
// Validate every mapping before the first write; RPC rechecks under the application lock.
for (const item of mappings) {
  const [{ data: app, error: appError }, { data: event, error: eventError }] = await Promise.all([
    db.from('applications').select('id,campaign_id,status,user:profiles!applications_user_id_fkey(email)').eq('id', item.applicationId).single(),
    db.from('email_feedback_events').select('recipient,source,event_type').eq('event_key', item.eventKey).single(),
  ]);
  if (appError || eventError || !app || !event || app.campaign_id !== item.campaignId
    || !['APPROVED','SELECTED'].includes(String(app.status).toUpperCase()) || event.source !== 'MAILBOX_IMPORT'
    || event.event_type !== 'BOUNCE' || String(app.user?.email || '').toLowerCase() !== event.recipient.toLowerCase()) throw new Error(`Mapping validation failed for application ${item.applicationId}`);
}
console.log(JSON.stringify({ verifiedMappings: mappings.length, mode: process.argv.includes('--apply') ? 'APPLY' : 'DRY_RUN' }));
if (process.argv.includes('--apply')) {
  let inserted = 0;
  for (const item of mappings) {
    const { data, error } = await db.rpc('import_historical_selection_email_hold', { p_application_id: item.applicationId, p_campaign_id: item.campaignId, p_event_key: item.eventKey });
    if (error) throw new Error(`Import stopped for application ${item.applicationId}: ${error.code}`);
    if (data) inserted++;
  }
  console.log(JSON.stringify({ inserted, alreadyRecorded: mappings.length - inserted }));
}
