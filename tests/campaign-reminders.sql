-- Run ONLY in an empty, isolated PostgreSQL test database with psql -f.
\set ON_ERROR_STOP on
begin;
create role anon;
create role authenticated;
create role service_role;
create table public.applications (
  id bigint primary key, status text, selected_at timestamptz, review_submitted boolean
);
-- A legacy selected row must not be backfilled by the migration.
insert into public.applications values (1, 'SELECTED', null, false);
\ir ../supabase/migrations/20261109010000_campaign_progress_reminders.sql
insert into public.applications values
  (2, 'PENDING', null, false),
  (3, 'SELECTED', '2026-11-01T00:30:00Z', false),
  (4, 'APPROVED', '2026-11-01T01:00:00Z', false),
  (5, 'SELECTED', '2026-11-01T01:00:01Z', false),
  (6, 'APPROVED', '2026-11-01T00:00:00Z', true);
update public.applications set status = 'SELECTED' where id = 2;
update public.applications set status = 'APPROVED' where id = 3;
do $$
begin
  if exists (select 1 from public.campaign_reminder_deliveries where application_id = 1) then raise exception 'Legacy row was backfilled'; end if;
  if (select selected_at from public.applications where id = 1) is not null then raise exception 'Legacy selection time was changed'; end if;
  if (select selected_at from public.applications where id = 2) is null then raise exception 'Selection time was not recorded'; end if;
  if (select due_at from public.campaign_reminder_deliveries where application_id = 3) <> '2026-11-08T01:00:00Z'::timestamptz then raise exception 'Before 10AM scheduling failed'; end if;
  if (select due_at from public.campaign_reminder_deliveries where application_id = 4) <> '2026-11-08T01:00:00Z'::timestamptz then raise exception 'Exact 10AM scheduling failed'; end if;
  if (select due_at from public.campaign_reminder_deliveries where application_id = 5) <> '2026-11-09T01:00:00Z'::timestamptz then raise exception 'After 10AM scheduling failed'; end if;
  if (select count(*) from public.campaign_reminder_deliveries where application_id = 3) <> 1 then raise exception 'Duplicate transition enqueued twice'; end if;
  if exists (select 1 from public.campaign_reminder_deliveries where application_id = 6) then raise exception 'Completed review was enqueued'; end if;
  if has_table_privilege('anon', 'public.campaign_reminder_deliveries', 'SELECT') or has_table_privilege('authenticated', 'public.campaign_reminder_deliveries', 'INSERT') then raise exception 'Client has access'; end if;
  if not has_table_privilege('service_role', 'public.campaign_reminder_deliveries', 'UPDATE') then raise exception 'Service has no access'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.campaign_reminder_deliveries'::regclass) then raise exception 'RLS disabled'; end if;
  if has_function_privilege('anon', 'public.enqueue_application_progress_reminder()', 'EXECUTE') then raise exception 'Anonymous function access'; end if;
  begin
    insert into public.campaign_reminder_deliveries(application_id,source,due_at) values (3,'AUTOMATIC',now());
    raise exception 'Unique key not enforced';
  exception when unique_violation then null;
  end;
end;
$$;
rollback;
\echo 'Campaign reminder SQL checks passed; all test data rolled back.'
