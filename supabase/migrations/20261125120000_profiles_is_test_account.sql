-- 에이전트 전용 테스트 계정 구분 플래그
-- 로컬 개발 환경도 운영 DB를 공유하므로, 테스트 계정을 통계·작성자 선택에서 제외하고
-- 운영 서버 렌더링에서는 비로그인으로 처리하기 위해 사용한다.
alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

comment on column public.profiles.is_test_account is '에이전트 테스트 계정 여부 (운영 화면 차단, 통계 제외)';
