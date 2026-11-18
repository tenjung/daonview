// Reviewed mailbox/SES records only. Dry-run by default; --apply writes production data.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { load } from '../tests/helpers/load-typescript.mjs';

const { feedbackRecordSchema } = load('src/lib/emailFeedback.ts');
const input = process.argv[2];
if (!input || input.startsWith('--')) throw new Error('Usage: node scripts/import-email-feedback.mjs <reviewed-records.json> [--apply] [--record-only]');
const records = JSON.parse(fs.readFileSync(input, 'utf8'));
if (!Array.isArray(records) || !records.length || records.length > 1000) throw new Error('Expected 1–1000 reviewed records');
const events = records.map(record => feedbackRecordSchema.parse(record));
if (new Set(events.map(event => event.event_key)).size !== events.length) throw new Error('Duplicate event keys');
console.log(JSON.stringify({ records: events.length, permanent: events.filter(e => e.bounce_type === 'PERMANENT').length, transient: events.filter(e => e.bounce_type === 'TRANSIENT').length, complaints: events.filter(e => e.event_type === 'COMPLAINT').length }));
if (!process.argv.includes('--apply')) {
  console.log('Dry-run only. No database changes.');
} else {
  dotenv.config({ path: '.env.local', quiet: true });
  const e = process.env;
  const host = new URL(e.NEXT_PUBLIC_SUPABASE_URL).hostname;
  if (host !== 'whpyftpktolpaspeuocg.supabase.co') throw new Error('Unexpected database target');
  const db = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let inserted = 0;
  for (const event of events) {
    const { data, error } = process.argv.includes('--record-only')
      ? await db.from('email_feedback_events').upsert(event, { onConflict: 'event_key', ignoreDuplicates: true }).select('event_key')
      : await db.rpc('record_email_feedback', { p_event: event });
    if (error) throw new Error(`Feedback import stopped: ${error.code}`);
    if (Array.isArray(data) ? data.length > 0 : data) inserted++;
  }
  console.log(JSON.stringify({ inserted, alreadyRecorded: events.length - inserted }));
}
