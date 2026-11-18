create table public.selection_email_deliveries (
  id bigint generated always as identity primary key,
  application_id bigint not null references public.applications(id) on delete cascade,
  recipient text not null check (length(recipient) between 3 and 320),
  status text not null default 'PREPARED' check (status in ('PREPARED','ACCEPTED','SKIPPED','UNKNOWN')),
  message_id text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index selection_email_deliveries_application_idx on public.selection_email_deliveries(application_id, id desc);

create table public.selection_email_holds (
  id uuid primary key default gen_random_uuid(),
  application_id bigint not null references public.applications(id) on delete cascade,
  delivery_id bigint not null references public.selection_email_deliveries(id),
  event_key text not null unique references public.email_feedback_events(event_key),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  resolution_reason text check (length(resolution_reason) between 1 and 500),
  check ((resolved_at is null and resolved_by is null and resolution_reason is null)
    or (resolved_at is not null and resolution_reason is not null))
);
create unique index selection_email_holds_active_idx on public.selection_email_holds(application_id) where resolved_at is null;
alter table public.selection_email_deliveries enable row level security;
alter table public.selection_email_holds enable row level security;
revoke all on public.selection_email_deliveries, public.selection_email_holds from public, anon, authenticated, service_role;
grant select, insert, update on public.selection_email_deliveries, public.selection_email_holds to service_role;
revoke all on sequence public.selection_email_deliveries_id_seq from public, anon, authenticated, service_role;
grant usage, select on sequence public.selection_email_deliveries_id_seq to service_role;

-- All writers lock the application first: serialize send ordering, feedback and resolution.
create function public.reconcile_selection_email_hold(p_application_id bigint) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare app_status text; delivery public.selection_email_deliveries; feedback public.email_feedback_events;
begin
  select upper(status) into app_status from public.applications where id = p_application_id for update;
  if app_status is null or app_status not in ('APPROVED','SELECTED') then return false; end if;
  select * into delivery from public.selection_email_deliveries
    where application_id = p_application_id and status <> 'SKIPPED' order by id desc limit 1;
  if delivery.message_id is null then return false; end if;
  select * into feedback from public.email_feedback_events
    where message_id = delivery.message_id and lower(recipient) = lower(delivery.recipient)
      and event_type = 'BOUNCE' order by occurred_at desc, event_key desc limit 1;
  if feedback.event_key is null then return false; end if;
  -- Includes resolved records: replay cannot reopen a manually cleared event.
  if exists (select 1 from public.selection_email_holds where event_key = feedback.event_key) then return false; end if;
  update public.selection_email_holds set resolved_at = now(), resolution_reason = 'SUPERSEDED'
    where application_id = p_application_id and resolved_at is null;
  insert into public.selection_email_holds(application_id, delivery_id, event_key)
    values (p_application_id, delivery.id, feedback.event_key);
  return true;
end;
$$;

create function public.begin_selection_email_delivery(p_application_id bigint, p_recipient text) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare app public.applications; delivery_id bigint;
begin
  select * into app from public.applications where id = p_application_id for update;
  if app.id is null or upper(app.status) not in ('APPROVED','SELECTED') then
    raise exception 'Application is not selected' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = app.user_id and lower(email) = lower(p_recipient)) then
    raise exception 'Recipient does not match application' using errcode = '22023';
  end if;
  insert into public.selection_email_deliveries(application_id,recipient)
    values (p_application_id, lower(p_recipient)) returning id into delivery_id;
  return delivery_id;
end;
$$;

create function public.finish_selection_email_delivery(p_delivery_id bigint, p_status text, p_message_id text default null) returns void
language plpgsql security invoker set search_path = '' as $$
declare app_id bigint; delivery public.selection_email_deliveries;
begin
  select application_id into app_id from public.selection_email_deliveries where id = p_delivery_id;
  if app_id is null then raise exception 'Unknown delivery' using errcode = '22023'; end if;
  perform 1 from public.applications where id = app_id for update;
  select * into delivery from public.selection_email_deliveries where id = p_delivery_id;
  if p_status not in ('ACCEPTED','SKIPPED','UNKNOWN')
    or (p_status = 'ACCEPTED' and coalesce(length(p_message_id),0) = 0)
    or (p_status <> 'ACCEPTED' and p_message_id is not null) then
    raise exception 'Invalid delivery outcome' using errcode = '22023';
  end if;
  if delivery.status = 'ACCEPTED' then
    if p_status <> 'ACCEPTED' or p_message_id is distinct from delivery.message_id then
      raise exception 'Accepted delivery cannot be overwritten' using errcode = '22023';
    end if;
  elsif delivery.status = 'SKIPPED' and p_status <> 'SKIPPED' then
    raise exception 'Skipped delivery cannot be overwritten' using errcode = '22023';
  else
    update public.selection_email_deliveries set status = p_status, message_id = p_message_id, completed_at = now()
      where id = p_delivery_id;
  end if;
  perform public.reconcile_selection_email_hold(app_id);
end;
$$;

create function public.resolve_selection_email_hold(p_application_id bigint, p_hold_id uuid, p_actor_id uuid, p_reason text) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id = p_actor_id and upper(role) in ('ADMIN','MASTER','SUPER_ADMIN')) then
    raise exception 'Admin required' using errcode = '42501';
  end if;
  if p_reason is null or length(trim(p_reason)) not between 1 and 500 then
    raise exception 'Resolution reason required' using errcode = '22023';
  end if;
  perform 1 from public.applications where id = p_application_id for update;
  update public.selection_email_holds set resolved_at = now(), resolved_by = p_actor_id, resolution_reason = trim(p_reason)
    where id = p_hold_id and application_id = p_application_id and resolved_at is null;
  return found;
end;
$$;

create function public.apply_selection_email_feedback() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare app_id bigint;
begin
  if new.event_type = 'BOUNCE' and new.message_id is not null then
    select application_id into app_id from public.selection_email_deliveries where message_id = new.message_id;
    if app_id is not null then perform public.reconcile_selection_email_hold(app_id); end if;
  end if;
  return new;
end;
$$;
create trigger selection_email_feedback_insert after insert on public.email_feedback_events
for each row execute function public.apply_selection_email_feedback();

-- Only explicitly reviewed MAILBOX_IMPORT records can backfill pre-tracking selections.
-- Refuse to overwrite any newer tracked send. Do not infer a campaign from an email alone.
create function public.import_historical_selection_email_hold(p_application_id bigint, p_campaign_id bigint, p_event_key text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare app public.applications; feedback public.email_feedback_events; delivery_id bigint;
begin
  select * into app from public.applications where id = p_application_id for update;
  select * into feedback from public.email_feedback_events where event_key = p_event_key;
  if app.id is null or app.campaign_id <> p_campaign_id or upper(app.status) not in ('SELECTED','APPROVED')
    or feedback.event_key is null or feedback.source <> 'MAILBOX_IMPORT' or feedback.event_type <> 'BOUNCE'
    or not exists (select 1 from public.profiles where id = app.user_id and lower(email) = lower(feedback.recipient)) then
    raise exception 'Historical mapping does not match application' using errcode = '22023';
  end if;
  if exists (select 1 from public.selection_email_holds where event_key = p_event_key) then return false; end if;
  if exists (select 1 from public.selection_email_deliveries where application_id = p_application_id) then
    raise exception 'Tracked delivery already exists; review history manually' using errcode = '22023';
  end if;
  insert into public.selection_email_deliveries(application_id,recipient,status,message_id,created_at,completed_at)
    values (p_application_id,feedback.recipient,'ACCEPTED',feedback.message_id,feedback.occurred_at,feedback.occurred_at)
    returning id into delivery_id;
  insert into public.selection_email_holds(application_id,delivery_id,event_key) values (p_application_id,delivery_id,p_event_key);
  return true;
end;
$$;

revoke all on function public.reconcile_selection_email_hold(bigint), public.begin_selection_email_delivery(bigint,text),
  public.finish_selection_email_delivery(bigint,text,text), public.resolve_selection_email_hold(bigint,uuid,uuid,text),
  public.apply_selection_email_feedback(), public.import_historical_selection_email_hold(bigint,bigint,text) from public, anon, authenticated;
grant execute on function public.reconcile_selection_email_hold(bigint), public.begin_selection_email_delivery(bigint,text),
  public.finish_selection_email_delivery(bigint,text,text), public.resolve_selection_email_hold(bigint,uuid,uuid,text),
  public.apply_selection_email_feedback(), public.import_historical_selection_email_hold(bigint,bigint,text) to service_role;
