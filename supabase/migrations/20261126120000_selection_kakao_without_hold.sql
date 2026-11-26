-- 선정 안내 알림톡을 메일 반송 보류 없이도 관리자가 미리보기 후 발송할 수 있게 한다.
-- 중복 발송 차단 기준: 보류 1건당 → 신청 1건당(진행·발송됨·결과불명은 1건만, 접수 거부 FAILED만 재시도 허용).
-- 보낸 문구를 기록해 신청자 표에서 다시 볼 수 있게 한다. 권한·RLS는 기존 그대로(service_role 전용, Data API 비노출).
alter table public.selection_kakao_deliveries alter column hold_id drop not null;
alter table public.selection_kakao_deliveries
  add column message_text text check (length(message_text) <= 1100),
  add column content_hash text check (content_hash ~ '^[a-f0-9]{64}$');

drop index public.selection_kakao_deliveries_active_idx;
create unique index selection_kakao_deliveries_active_idx on public.selection_kakao_deliveries(application_id)
  where status in ('PREPARED','SENT','UNKNOWN');
create index selection_kakao_deliveries_application_idx on public.selection_kakao_deliveries(application_id, id desc);

comment on table public.selection_kakao_deliveries is
  '관리자가 미리보기 후 수동 발송한 선정 안내 알림톡. hold_id는 메일 반송 보류에서 보낸 경우만. 신청 1건당 활성 발송 1건.';
