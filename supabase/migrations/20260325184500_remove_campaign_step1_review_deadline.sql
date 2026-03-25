update public.campaigns
set campaign_options = jsonb_strip_nulls(
  jsonb_set(
    coalesce(campaign_options, '{}'::jsonb),
    '{step1Data,reviewDeadline}',
    'null'::jsonb,
    true
  )
)
where campaign_options->'step1Data' ? 'reviewDeadline';
