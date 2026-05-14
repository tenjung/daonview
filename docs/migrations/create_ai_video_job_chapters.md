# ai_video_job_chapters 생성 가이드

아래 SQL을 Supabase SQL Editor에서 실행한다.

```sql
create table if not exists public.ai_video_job_chapters (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.ai_video_jobs(id) on delete cascade,
  chapter_index integer not null,
  chapter_title text null,
  narration text not null,
  visual_summary text null,
  image_prompt text not null,
  motion_prompt text null,
  status text not null default 'QUEUED',
  image_url text null,
  storage_path text null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_video_job_chapters_status_check check (
    status in ('QUEUED', 'GENERATING', 'COMPLETED', 'FAILED')
  ),
  constraint ai_video_job_chapters_job_index_unique unique (job_id, chapter_index)
);

create index if not exists ai_video_job_chapters_job_id_idx
  on public.ai_video_job_chapters(job_id, chapter_index);

revoke all on table public.ai_video_job_chapters from anon;
revoke all on table public.ai_video_job_chapters from authenticated;

grant select on table public.ai_video_job_chapters to authenticated;
grant select, insert, update, delete on table public.ai_video_job_chapters to service_role;

alter table public.ai_video_job_chapters enable row level security;

drop policy if exists ai_video_job_chapters_select_own_job
  on public.ai_video_job_chapters;

create policy ai_video_job_chapters_select_own_job
  on public.ai_video_job_chapters
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_video_jobs jobs
      where jobs.id = ai_video_job_chapters.job_id
        and jobs.user_id = auth.uid()
    )
  );
```

검증:
- `ai_video_jobs` 와 FK 연결이 생겨야 한다.
- `job_id + chapter_index` 중복 입력이 막혀야 한다.
- 상태값은 반드시 대문자 문자열만 허용돼야 한다.
- Supabase Security Advisor에서 `rls_disabled_in_public` 경고가 없어야 한다.
- anon role은 직접 조회/수정할 수 없어야 한다.
- authenticated role은 본인 `ai_video_jobs`에 연결된 챕터만 조회할 수 있어야 한다.

주의:
- 이 테이블이 없으면 `/api/ai-service/video/jobs/[id]` 조회와 워커 챕터 저장이 실패한다.
- 실행 후 Supabase 관계 캐시 반영이 늦으면 잠시 뒤 재조회한다.
