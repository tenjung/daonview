-- 선정 메일 반송(보류) 건에 대해 관리자가 수동 발송한 카카오 알림톡 기록.
-- Data API 비노출: service_role 전용(서버 라우트 경유).
create table public.selection_kakao_deliveries (
  id bigint generated always as identity primary key,
  application_id bigint not null references public.applications(id) on delete cascade,
  hold_id uuid not null references public.selection_email_holds(id) on delete cascade,
  recipient_phone text not null check (recipient_phone ~ '^01[0-9]{8,9}$'),
  status text not null default 'PREPARED' check (status in ('PREPARED','SENT','FAILED','UNKNOWN')),
  message_id text unique,
  error_message text check (length(error_message) <= 500),
  sent_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status = 'SENT') = (message_id is not null))
);
create index selection_kakao_deliveries_hold_idx on public.selection_kakao_deliveries(hold_id, id desc);
-- 보류 1건당 성공·진행·결과불명 발송은 1개만: 중복 클릭/동시 요청 차단. FAILED만 재시도 허용.
create unique index selection_kakao_deliveries_active_idx on public.selection_kakao_deliveries(hold_id)
  where status in ('PREPARED','SENT','UNKNOWN');

alter table public.selection_kakao_deliveries enable row level security;
revoke all on public.selection_kakao_deliveries from public, anon, authenticated, service_role;
grant select, insert, update on public.selection_kakao_deliveries to service_role;
revoke all on sequence public.selection_kakao_deliveries_id_seq from public, anon, authenticated, service_role;
grant usage, select on sequence public.selection_kakao_deliveries_id_seq to service_role;
