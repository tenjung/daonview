alter table public.campaigns
  add column if not exists is_unlimited_recruitment boolean not null default false;

alter table public.campaigns
  alter column end_date drop not null,
  alter column recruit_count drop not null,
  alter column total_recruitment drop not null;

update public.campaigns
set
  is_unlimited_recruitment = (
    coalesce(recruit_count, 0) >= 999999
    or coalesce(total_recruitment, 0) >= 999999
  ),
  is_always = coalesce(is_always, false) or end_date = date '9999-12-31';

update public.campaigns
set end_date = null
where is_always is true;

update public.campaigns
set
  recruit_count = null,
  total_recruitment = null
where is_unlimited_recruitment is true;
