# 체험 진행 안내 메일 운영

- 자동 안내: 기능 적용 이후 선정 상태로 전환된 신청 건만 예약한다. 선정 후 168시간이 지난 뒤 처음 도래하는 한국시간 오전 10시가 발송 예정 시각이다.
- 기존 대상: #44 이큐비아만 명시적 수동 요청으로 등록한다. 기존 선정일은 보정하지 않는다.
- 메일: `CAMPAIGN_PROGRESS_REMINDER`, 기존 AWS SES 설정과 수신 정책을 사용한다. 운영에는 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CRON_SECRET`이 필요하다. 비밀값은 출력하지 않는다.

## 배포 순서

1. SQL을 격리 DB에서 검증하고, 운영 적용 직전 승인을 받는다.
2. `supabase/migrations/20261109010000_campaign_progress_reminders.sql`을 적용한다. 기존 신청 건은 변경하지 않는다. 이후 새 선정 트랜잭션에 선정 시각과 예약이 함께 기록된다.
3. RLS, service_role 전용 권한, 고정 search_path 및 Security Advisor를 확인한다.
4. 검증한 코드를 커밋·푸시하고 해당 SHA의 Vercel production 배포가 READY인지 확인한다.
5. `POST /api/cron/campaign-reminders`에 `Authorization: Bearer <CRON_SECRET>`와 JSON `{"campaignId":44}`를 전달해 승인된 기존 대상에게 1회 발송한다. 다른 campaignId는 거절된다. 실제 발송 직전 상태를 다시 확인한다.

정기 실행은 `GET /api/cron/campaign-reminders`, 매일 `0 1 * * *`(UTC)이다. 수동 대상은 정기 실행에서 발송하지 않는다. `CRON_SECRET`이 없거나 실제 발송 설정이 부족하면 예약을 소비하지 않고 503을 반환한다.

## 이력 확인

`public.campaign_reminder_deliveries`를 source/status/reason별로 집계한다. 이메일 주소나 본문은 이력 테이블에 저장하지 않는다.

- `SENT`: SES가 발송 요청을 접수하고 message_id를 반환함. 수신함 도착 여부는 별도 확인한다.
- `SKIPPED`: 리뷰 제출·취소·종료·주소 누락·수신거부 등으로 발송하지 않음.
- `FAILED`: 발송 준비 실패 또는 제공자의 명시적인 거절. 자동 재발송하지 않음.
- `UNKNOWN`: 응답 유실·실행 중단으로 실제 발송 여부를 모름. 제공자 이력을 대조하기 전 재발송 금지.
- 15분 이상 남은 `PROCESSING`은 다음 실행에서 `UNKNOWN`으로 전환한다.

한 실행은 45초 이내에 새 메일 시도를 시작하며 남은 대기 건수를 반환한다. 수동 발송에서 remaining이 있으면 이력을 확인하고 같은 요청을 이어서 실행할 수 있다. 완료된 건은 고유 제약과 조건부 claim 때문에 다시 발송하지 않는다.

## 중지·복구

장애 시 새 자동 실행을 중지하고 이력은 보존한다. SQL 예약을 중지해야 한다면 승인 후 두 application 트리거를 비활성화한다. 배포만 되돌려도 DB 트리거는 남으므로 별도로 확인한다. 기존 selected_at 값과 발송 이력은 삭제하거나 되돌리지 않는다. UNKNOWN을 PENDING으로 일괄 변경하지 않는다.

## 로컬 검증

`node --test scripts/test-review-approval.mjs tests/campaign-reminders.test.mjs tests/campaign-actions.test.mjs`

`tests/campaign-reminders.sql`은 빈 격리 PostgreSQL DB에서만 실행한다. 가짜 applications/roles를 만든 뒤 실제 migration을 적용하고 트리거·시간 경계·권한·중복 제약을 검증한다. 전체 트랜잭션은 rollback한다.
