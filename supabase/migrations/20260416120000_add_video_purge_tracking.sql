alter table public.ai_video_jobs
  add column if not exists result_viewed_at timestamptz null,
  add column if not exists purge_after timestamptz null,
  add column if not exists purged_at timestamptz null,
  add column if not exists purge_error text null;

create index if not exists ai_video_jobs_purge_due_idx
  on public.ai_video_jobs (purge_after)
  where purged_at is null and purge_after is not null;
