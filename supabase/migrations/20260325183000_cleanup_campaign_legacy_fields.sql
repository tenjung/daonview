-- Normalize legacy campaign fields into the canonical schema.
with normalized as (
  select
    id,
    coalesce(total_recruitment, recruit_count) as normalized_total_recruitment,
    case
      when coalesce(is_unlimited_recruitment, false) then '999'
      when coalesce(total_recruitment, recruit_count) is null then null
      else coalesce(total_recruitment, recruit_count)::text
    end as normalized_total_recruitment_text,
    case
      when upper(coalesce(campaign_options->'step1Data'->>'scheduleType', '')) = 'FAST' then 'FAST'
      else 'DEFAULT'
    end as normalized_schedule_type
  from campaigns
)
update campaigns c
set
  total_recruitment = case
    when c.is_unlimited_recruitment then null
    else n.normalized_total_recruitment
  end,
  is_always = false,
  campaign_options = jsonb_strip_nulls(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                coalesce(c.campaign_options, '{}'::jsonb),
                '{step1Data,scheduleType}',
                to_jsonb(n.normalized_schedule_type),
                true
              ),
              '{step1Data,platform}',
              'null'::jsonb,
              true
            ),
            '{step1Data,totalRecruitment}',
            'null'::jsonb,
            true
          ),
          '{step1Data,campaignType}',
          'null'::jsonb,
          true
        ),
        '{step1Data,recruitmentStartDate}',
        'null'::jsonb,
        true
      ),
      '{step1Data,firstSelectionDate}',
      'null'::jsonb,
      true
    )
  )
from normalized n
where c.id = n.id;

drop function if exists public.increment_campaign_recruit_count(integer);

alter table public.campaigns
  drop column if exists recruit_count,
  drop column if exists is_always;
