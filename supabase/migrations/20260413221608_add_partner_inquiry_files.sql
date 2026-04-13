alter table public.partner_inquiries
  add column if not exists requested_channels text[] not null default '{}'::text[],
  add column if not exists product_file_path text,
  add column if not exists product_file_name text,
  add column if not exists product_file_mime text,
  add column if not exists product_file_size bigint,
  add column if not exists inquiry_source text not null default 'PARTNER_ROOT';

alter table public.partner_inquiries
  drop constraint if exists partner_inquiries_requested_channels_check,
  add constraint partner_inquiries_requested_channels_check
    check (
      requested_channels <@ array[
        'OFFLINE',
        'CLOSED_MALL',
        'GROUP_BUY',
        'GLOBAL',
        'RECOMMEND_ALL'
      ]::text[]
    );

alter table public.partner_inquiries
  drop constraint if exists partner_inquiries_inquiry_source_check,
  add constraint partner_inquiries_inquiry_source_check
    check (inquiry_source = upper(inquiry_source));

insert into storage.buckets (id, name, public)
values ('partner-inquiry-files', 'partner-inquiry-files', false)
on conflict (id) do update set public = false;
