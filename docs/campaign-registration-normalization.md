# Campaign Registration Normalization Notes

## Current Canonical Rules

- `campaigns` table columns are the canonical source for registration summary data.
- `campaign_options` is treated as a form snapshot for restoration-only details.
- registration UI exposes only `DEFAULT` and `FAST`; legacy `ALWAYS` values are read as `FAST`
- `FAST` campaigns are rolling recruitment schedules: the first `end_date` is 14 days out, and active campaigns keep extending by 14 days.
- `FAST` extension is driven by `scheduleType` plus active status (`RECRUITING`/`ONGOING`), not by `is_unlimited_recruitment` or selected applicant count.
- `FAST` campaigns stop accepting applications only when the campaign status becomes inactive, such as `COMPLETED`.
- When both exist, read priority is:
  1. canonical column
  2. `campaign_options`

## Column-First Fields

- `title`
- `created_by`
- `status`
- `type`
- `platform`
- `category`
- `region`
- `sub_region`
- `recruitment_start_date`
- `first_selection_date`
- `end_date`
- `is_always`
- `is_unlimited_recruitment`
- `recruit_count`
- `total_recruitment`
- `thumbnail_url`
- `brand_id`

## Snapshot-First Fields

- `includeReview`
- `includeNaver`
- `includeInstagram`
- visit detail fields
- guide text fields
- coupon and external order fields

## DB Cleanup Candidates For Phase 2

- `type` vs `campaign_options.step1Data.campaignType`
- `platform` vs `campaign_options.step1Data.platform`
- `recruit_count` vs `total_recruitment` vs `campaign_options.step1Data.totalRecruitment`
- `campaign_images` / `thumbnail_url` vs `campaign_options.step2Data.campaignImages`

## Guardrails

- Do not remove DB fields until all read paths are confirmed.
- New registration logic must serialize draft save and final submit through the same canonical normalization path.
