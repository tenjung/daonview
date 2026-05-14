alter table public.campaigns
  add column if not exists campaign_image_variants jsonb not null default '[]'::jsonb;

comment on column public.campaigns.campaign_image_variants is
  'Campaign image variants for display separation: originalPath for retained source, thumbnailUrl for public cards, mediumUrl for expanded detail.';
