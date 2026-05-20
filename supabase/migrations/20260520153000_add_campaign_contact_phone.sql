alter table public.campaigns
  add column if not exists contact_phone text;

comment on column public.campaigns.contact_phone is
  'Campaign contact phone for visit reservation/contact display. Existing values may also live in campaign_options.step1Data.contactPhone.';
