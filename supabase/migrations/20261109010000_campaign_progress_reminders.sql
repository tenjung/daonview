-- Only future selection transitions enqueue automatically. No existing rows are backfilled.
create table public.campaign_reminder_deliveries (
  id bigint generated always as identity primary key,
  application_id bigint not null references public.applications(id) on delete cascade,
  notification_type text not null default 'CAMPAIGN_PROGRESS_REMINDER'
    check (notification_type = 'CAMPAIGN_PROGRESS_REMINDER'),
  source text not null check (source in ('AUTOMATIC', 'MANUAL_CAMPAIGN_44')),
  due_at timestamptz not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PROCESSING', 'SENT', 'SKIPPED', 'FAILED', 'UNKNOWN')),
  claimed_at timestamptz,
  completed_at timestamptz,
  message_id text,
  reason text,
  created_at timestamptz not null default now(),
  unique (application_id, notification_type)
);

create index campaign_reminders_pending_due_idx
  on public.campaign_reminder_deliveries (source, due_at, id) where status = 'PENDING';
create index campaign_reminders_processing_idx
  on public.campaign_reminder_deliveries (claimed_at) where status = 'PROCESSING';

alter table public.campaign_reminder_deliveries enable row level security;
revoke all on public.campaign_reminder_deliveries from public, anon, authenticated;
grant select, insert, update on public.campaign_reminder_deliveries to service_role;
revoke all on sequence public.campaign_reminder_deliveries_id_seq from public, anon, authenticated;
grant usage, select on sequence public.campaign_reminder_deliveries_id_seq to service_role;
-- No client policies: this operational table is service_role-only.

create function public.stamp_application_selection_time()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if upper(coalesce(new.status, '')) not in ('SELECTED', 'APPROVED') then return new; end if;
  if tg_op = 'UPDATE' then
    if upper(coalesce(old.status, '')) in ('SELECTED', 'APPROVED') then return new; end if;
  end if;
  new.selected_at := coalesce(new.selected_at, statement_timestamp());
  return new;
end;
$$;

create function public.enqueue_application_progress_reminder()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_eligible_at timestamptz;
  v_due_at timestamptz;
begin
  if upper(coalesce(new.status, '')) not in ('SELECTED', 'APPROVED') then return new; end if;
  if tg_op = 'UPDATE' then
    if upper(coalesce(old.status, '')) in ('SELECTED', 'APPROVED') then return new; end if;
  end if;
  if coalesce(new.review_submitted, false) then return new; end if;
  -- 168 hours later, then the first Asia/Seoul 10:00 at or after that instant.
  v_eligible_at := new.selected_at + interval '168 hours';
  v_due_at := (date_trunc('day', v_eligible_at at time zone 'Asia/Seoul') + interval '10 hours') at time zone 'Asia/Seoul';
  if v_due_at < v_eligible_at then v_due_at := v_due_at + interval '24 hours'; end if;
  insert into public.campaign_reminder_deliveries (application_id, source, due_at)
    values (new.id, 'AUTOMATIC', v_due_at)
    on conflict (application_id, notification_type) do nothing;
  return new;
end;
$$;

revoke all on function public.stamp_application_selection_time() from public, anon, authenticated;
revoke all on function public.enqueue_application_progress_reminder() from public, anon, authenticated;
grant execute on function public.stamp_application_selection_time() to service_role;
grant execute on function public.enqueue_application_progress_reminder() to service_role;

create trigger stamp_application_selection_time
  before insert or update of status on public.applications
  for each row execute function public.stamp_application_selection_time();
create trigger enqueue_application_progress_reminder
  after insert or update of status on public.applications
  for each row execute function public.enqueue_application_progress_reminder();

comment on table public.campaign_reminder_deliveries is
  'Service-only campaign progress emails. SENT means SES accepted, not inbox delivery. UNKNOWN must not auto-retry.';
