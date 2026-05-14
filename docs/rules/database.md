# 다온뷰 데이터베이스 보안 규칙

## 1. Supabase public 테이블 생성 원칙
- `public` 스키마 테이블은 Supabase Data API 노출 대상이 될 수 있으므로 생성 SQL에 반드시 `GRANT`, `ENABLE ROW LEVEL SECURITY`, RLS policy를 함께 포함한다.
- 테이블 생성만 하고 RLS/policy를 나중으로 미루는 방식은 금지한다.
- 상태/타입 값은 기존 규칙대로 `UPPERCASE_STRING`만 저장한다.

## 2. GRANT 기준
- `anon`: 공개 읽기처럼 비로그인 접근이 비즈니스 요구로 확정된 경우에만 최소 권한을 부여한다.
- `authenticated`: 로그인 사용자가 직접 접근해야 하는 작업만 `select`, `insert`, `update`, `delete` 중 필요한 권한만 부여한다.
- `service_role`: 서버 API, 배치, 워커처럼 백엔드 전용 흐름에서만 사용한다.
- Data API로 노출할 필요가 없는 운영/민감 테이블은 `anon`/`authenticated` 권한을 주지 않는다.

## 3. RLS policy 기준
- 사용자 소유 데이터는 `user_id = auth.uid()` 또는 부모 테이블 소유자 검증으로 제한한다.
- 서버 전용 테이블은 RLS를 켜되 일반 role policy를 만들지 않는다.
- public read가 필요한 테이블도 쓰기 policy에 `WITH CHECK (true)`를 쓰지 않는다. 생성/수정 주체를 검증할 수 없으면 서버 API로 우회한다.

## 4. 마이그레이션 체크리스트
- 새 테이블 또는 권한 변경 SQL에는 아래 항목을 모두 검토한다.
- `grant ... to anon/authenticated/service_role`
- `alter table ... enable row level security`
- `create policy ... using (...)`
- `create policy ... with check (...)`
- sequence가 있으면 sequence `USAGE` 권한도 필요한 role에만 부여한다.
- 적용 후 Supabase Security Advisor에서 `rls_disabled_in_public`이 없는지 재확인한다.

## 5. 현재 기준 긴급 보안 이력
- 2026-05-13 기준 `ai_landing_logs`, `ai_writing_logs`, `campaign_purchase_links`, `ai_video_job_chapters`는 RLS 누락으로 보안 조치 대상이 되었다.
- AI 로그 테이블은 본인 로그만 `select/insert` 가능해야 한다.
- 구매링크와 영상 챕터 쓰기 작업은 서버 `service_role` 경유를 기본으로 한다.
