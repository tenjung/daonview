-- Server-only operational data. No anon/authenticated access or policies.
create table public.email_feedback_events (
  event_key text primary key check (event_key ~ '^[a-f0-9]{64}$'),
  source text not null check (source in ('SES_SNS', 'MAILBOX_IMPORT', 'SES_SUPPRESSION')),
  message_id text,
  recipient text not null check (length(recipient) between 3 and 320),
  event_type text not null check (event_type in ('BOUNCE', 'COMPLAINT')),
  bounce_type text check (bounce_type in ('PERMANENT', 'TRANSIENT', 'UNDETERMINED')),
  reason text not null check (reason in ('MAILBOX_INACTIVE', 'USER_NOT_FOUND', 'MAILBOX_FULL', 'SUPPRESSED', 'COMPLAINT', 'OTHER')),
  smtp_status text, diagnostic text, subject text,
  occurred_at timestamptz not null, created_at timestamptz not null default now(),
  constraint feedback_bounce_type check ((event_type = 'BOUNCE' and bounce_type is not null) or (event_type = 'COMPLAINT' and bounce_type is null))
);
create index email_feedback_events_occurred_at_idx on public.email_feedback_events (occurred_at desc, event_key);
create index email_feedback_events_message_id_idx on public.email_feedback_events (message_id) where message_id is not null;
alter table public.email_feedback_events enable row level security;
revoke all on public.email_feedback_events from public, anon, authenticated, service_role;
grant select, insert on public.email_feedback_events to service_role;

-- Event insert and profile suppression succeed or roll back together.
create function public.record_email_feedback(p_event jsonb) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare inserted_key text;
begin
  insert into public.email_feedback_events
    (event_key, source, message_id, recipient, event_type, bounce_type, reason, smtp_status, diagnostic, subject, occurred_at)
  values (p_event->>'event_key', p_event->>'source', p_event->>'message_id', lower(p_event->>'recipient'),
    p_event->>'event_type', p_event->>'bounce_type', p_event->>'reason', p_event->>'smtp_status',
    p_event->>'diagnostic', p_event->>'subject', (p_event->>'occurred_at')::timestamptz)
  on conflict (event_key) do nothing returning event_key into inserted_key;
  if inserted_key is null then return false; end if;
  if p_event->>'event_type' = 'COMPLAINT' then
    update public.profiles set email_subscription_status = 'COMPLAINED'
    where lower(email) = lower(p_event->>'recipient') and upper(email_subscription_status) in ('SUBSCRIBED', 'BOUNCED');
  elsif p_event->>'bounce_type' = 'PERMANENT' then
    update public.profiles set email_subscription_status = 'BOUNCED'
    where lower(email) = lower(p_event->>'recipient') and upper(email_subscription_status) = 'SUBSCRIBED';
  end if;
  return true;
end;
$$;
revoke all on function public.record_email_feedback(jsonb) from public, anon, authenticated;
grant execute on function public.record_email_feedback(jsonb) to service_role;
comment on table public.email_feedback_events is 'SES and verified historical mailbox feedback; no full email bodies stored. Permanent failures suppress sends, transient failures are recorded only.';
