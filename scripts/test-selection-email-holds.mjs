// Isolated temporary Postgres cluster; never reads .env or connects to production.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { load } from '../tests/helpers/load-typescript.mjs';

const normalizer = load('src/lib/selectionEmailHold.ts');
test('management hold preserves selected state and ignores terminal applications', () => {
  const h = normalizer.normalizeSelectionEmailHold({ id: 'hold', application_id: 1, feedback: { recipient: 'test@example.com', reason: 'mailbox_full', occurred_at: '2026-11-18T00:00:00Z' } });
  assert.equal(h.reason, 'MAILBOX_FULL');
  for (const status of ['APPROVED','selected']) assert.equal(normalizer.getApplicationManagementStatus(status,h), 'HELD');
  for (const status of ['COMPLETED','CANCELLED','REJECTED']) assert.equal(normalizer.getApplicationManagementStatus(status,h), status);
  assert.equal(normalizer.getApplicationManagementStatus('APPROVED'), 'APPROVED');
  assert.throws(() => normalizer.normalizeSelectionEmailHold({}));
});

function trackingFixture({ beginError = false, finishError = false, env = {} } = {}) {
  const calls = [];
  const { trackSelectionEmail } = load('src/lib/selectionEmailDelivery.ts', {
    '@/lib/supabase/admin': { createAdminClient: () => ({ rpc: async (name,args) => {
      calls.push({name,args});
      return name === 'begin_selection_email_delivery' ? { data: 7, error: beginError ? {} : null } : { error: finishError ? {} : null };
    } }) },
  }, { env: { NODE_ENV: 'production', AWS_ACCESS_KEY_ID: 'test', ...env } });
  return { trackSelectionEmail,calls };
}
test('tracks recipient before sending, and binds accepted message ID without resending', async () => {
  const f = trackingFixture(); let sends = 0;
  await f.trackSelectionEmail(1,'test@example.com',async () => { sends++; assert.equal(f.calls.length,1); return {success:true,messageId:'ses-1'}; });
  assert.equal(sends,1);
  assert.equal(f.calls[1].args.p_message_id,'ses-1');
  assert.equal(f.calls[1].args.p_status,'ACCEPTED');
  const fail = trackingFixture({finishError:true});
  const result = await fail.trackSelectionEmail(1,'test@example.com',async () => { sends++; return {success:true,messageId:'ses-2'}; });
  assert.equal(sends,2); assert.equal(result.success,false); assert.ok(result.message.includes('재발송 전에'));
});
test('tracking preparation failure never sends; uncertainty and policy skip are distinct', async () => {
  const fail = trackingFixture({beginError:true}); let sends = 0;
  await assert.rejects(fail.trackSelectionEmail(1,'test@example.com',async () => { sends++; return {success:true}; }));
  assert.equal(sends,0);
  const unknown = trackingFixture();
  await assert.rejects(unknown.trackSelectionEmail(1,'test@example.com',async () => { throw new Error('connection lost'); }));
  assert.equal(unknown.calls[1].args.p_status,'UNKNOWN');
  const skipped = trackingFixture();
  await skipped.trackSelectionEmail(1,'test@example.com',async () => ({success:false,skipped:true}));
  assert.equal(skipped.calls[1].args.p_status,'SKIPPED');
});

test('real SQL: feedback races, replay, manual resolution, terminal states and RLS', { timeout: 30000 }, (t) => {
  let bin;
  try { bin = execFileSync('pg_config',['--bindir'],{encoding:'utf8'}).trim(); } catch { t.skip('Local PostgreSQL binaries unavailable'); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'daonview-hold-sql-'));
  const dataDir = path.join(dir,'data');
  const pg = (name,args) => execFileSync(path.join(bin,name),args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const sql = text => pg('psql',['-XAt','-v','ON_ERROR_STOP=1','-h',dir,'-U','postgres','-d','postgres','-c',text]).trim();
  const adminId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000002';
  const event = (key,messageId,recipient='member@example.com',bounceType='PERMANENT',source='SES_SNS') => {
    const e = {event_key:key.repeat(64),source,message_id:messageId,recipient,event_type:'BOUNCE',bounce_type:bounceType,reason:bounceType === 'TRANSIENT'?'MAILBOX_FULL':'MAILBOX_INACTIVE',smtp_status:'5.2.1',diagnostic:'test',subject:'test',occurred_at:'2026-11-18T00:00:00Z'};
    return `select public.record_email_feedback('${JSON.stringify(e)}'::jsonb);`;
  };
  let started = false;
  try {
    pg('initdb',['-D',dataDir,'-A','trust','-U','postgres','--no-locale','-E','UTF8']);
    pg('pg_ctl',['-D',dataDir,'-l',path.join(dir,'postgres.log'),'-o',`-k ${dir} -h ''`,'-w','start']); started = true;
    sql(`create role anon; create role authenticated; create role service_role bypassrls;
      create table public.profiles(id uuid primary key,email text,role text,email_subscription_status text);
      create table public.applications(id bigint primary key,user_id uuid references public.profiles(id),campaign_id bigint,status text);
      grant select,update on public.profiles,public.applications to service_role;
      insert into public.profiles values ('${adminId}','admin@example.com','ADMIN','SUBSCRIBED'),('${userId}','member@example.com','INFLUENCER','SUBSCRIBED');
      insert into public.applications values (1,'${userId}',44,'APPROVED'),(2,'${userId}',45,'SELECTED'),(3,'${userId}',46,'COMPLETED'),(4,'${userId}',47,'APPROVED');`);
    sql(fs.readFileSync('supabase/migrations/20261118093904_email_feedback.sql','utf8'));
    sql(fs.readFileSync('supabase/migrations/20261118093905_selection_email_holds.sql','utf8'));
    const service = text => sql(`set role service_role; ${text}`);
    service("select public.begin_selection_email_delivery(1,'member@example.com');");
    service(event('a','ses-1'));
    assert.equal(sql('select count(*) from public.selection_email_holds;'),'0','early feedback stored before provider binding');
    service("select public.finish_selection_email_delivery(1,'ACCEPTED','ses-1');");
    assert.equal(sql('select count(*) from public.selection_email_holds where resolved_at is null;'),'1');
    assert.equal(sql('select status from public.applications where id=1;'),'APPROVED');
    const firstHold = sql('select id from public.selection_email_holds where application_id=1;');
    assert.throws(() => service(`select public.resolve_selection_email_hold(1,'${firstHold}','${userId}','not admin');`));
    service(`select public.resolve_selection_email_hold(1,'${firstHold}','${adminId}','주소 확인');`);
    service(event('a','ses-1'));
    service('select public.reconcile_selection_email_hold(1);');
    assert.equal(sql('select count(*) from public.selection_email_holds where resolved_at is null;'),'0','replay cannot reopen resolved event');
    service("select public.begin_selection_email_delivery(1,'member@example.com');");
    service(event('b','ses-1'));
    assert.equal(sql('select count(*) from public.selection_email_holds where resolved_at is null;'),'0','old bounce cannot hold newer attempt');
    service(event('c','ses-2'));
    service("select public.finish_selection_email_delivery(2,'ACCEPTED','ses-2');");
    assert.equal(sql('select count(*) from public.selection_email_holds where resolved_at is null;'),'1');
    assert.equal(service(`select public.resolve_selection_email_hold(1,'${firstHold}','${adminId}','stale');`).split('\n').at(-1),'f','stale release is rejected');
    assert.throws(() => service("select public.finish_selection_email_delivery(2,'UNKNOWN',null);"));
    sql("update public.profiles set email_subscription_status='SUBSCRIBED' where email='member@example.com';");
    service("select public.begin_selection_email_delivery(2,'member@example.com'); select public.finish_selection_email_delivery(3,'ACCEPTED','ses-full');");
    service(event('d','ses-full','member@example.com','TRANSIENT'));
    assert.equal(sql('select count(*) from public.selection_email_holds where application_id=2 and resolved_at is null;'),'1');
    assert.equal(sql("select email_subscription_status from public.profiles where email='member@example.com';"),'SUBSCRIBED','mailbox full must not suppress recipient permanently');
    sql("update public.applications set status='COMPLETED' where id=2;");
    service(event('e','ses-full','member@example.com','TRANSIENT'));
    assert.equal(sql('select count(*) from public.selection_email_holds where application_id=2;'),'1','terminal application has no new hold');
    service(event('f','unrelated-message'));
    assert.equal(sql('select count(*) from public.selection_email_holds;'),'3','untracked email cannot hold applications');
    service(event('1',null,'member@example.com','TRANSIENT','MAILBOX_IMPORT'));
    service(`select public.import_historical_selection_email_hold(4,47,'${'1'.repeat(64)}');`);
    assert.equal(sql('select count(*) from public.selection_email_holds where application_id=4;'),'1','reviewed mailbox record without message ID can be linked explicitly');
    service(`select public.import_historical_selection_email_hold(4,47,'${'1'.repeat(64)}');`);
    assert.equal(sql('select count(*) from public.selection_email_holds where application_id=4;'),'1');
    for (const role of ['anon','authenticated']) {
      assert.equal(sql(`select has_table_privilege('${role}','public.selection_email_holds','SELECT');`),'f');
      assert.equal(sql(`select has_function_privilege('${role}','public.resolve_selection_email_hold(bigint,uuid,uuid,text)','EXECUTE');`),'f');
    }
    sql('revoke update on public.profiles from service_role;');
    assert.throws(() => service(event('2','rollback')));
    assert.equal(sql(`select count(*) from public.email_feedback_events where event_key='${'2'.repeat(64)}';`),'0','feedback insert rolls back if profile update fails');
  } finally {
    if (started) pg('pg_ctl',['-D',dataDir,'-m','immediate','-w','stop']);
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
