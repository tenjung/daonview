# 이메일 반송 자동 반영

## 처리 경로

SES의 Bounce/Complaint → SNS HTTPS 알림 → `/api/webhooks/aws-ses` →
`email_feedback_events` 기록 및 `profiles.email_subscription_status` 변경.
관리자 메일함으로 전송되는 기존 반송 알림은 계속 유지한다.
IMAP 활성화와 메일함 비밀번호는 필요하지 않다. Resend 발송은 이 SES 경로에 포함되지 않는다.

- `PERMANENT` 반송: `SUBSCRIBED`인 회원만 `BOUNCED`로 변경한다.
- `TRANSIENT`/`UNDETERMINED`: 원인만 기록한다. 자동 재발송이나 영구 차단은 하지 않는다.
- `COMPLAINT`: `SUBSCRIBED`/`BOUNCED` 회원을 `COMPLAINED`로 변경한다.
- `UNSUBSCRIBED`/`COMPLAINED`를 반송 이벤트로 덮어쓰지 않는다.
- 반송 실패는 발송 API의 접수 성공과 별개다. `campaign_reminder_deliveries.SENT`는
  SES 접수 기록으로 유지하며 도착 성공으로 해석하지 않는다. 실제 실패는 message_id로 대조한다.
- SNS 재전송은 feedbackId+수신자 키로 중복 처리하지 않는다. 이벤트 저장과 회원 상태 갱신은
  하나의 DB 트랜잭션이다. DB 장애에는 500, 인증서 다운로드 장애에는 503을 반환해 재시도시킨다.
- 전체 메일 본문을 저장하지 않는다. 수신 주소·시각·제목·메시지 ID·SMTP 상태·오류 응답만 저장한다.

## SES 계정 차단 목록 자동 반영 (AWS 콘솔 설정 불필요)

SNS 연결 전에도 반송을 자동으로 잡기 위한 경로. 기존 SES 발송 키로 계정 차단 목록을 읽는다.

- 크론 `/api/cron/sync-email-suppression`: 매일 18:00 KST(`0 9 * * *` UTC, Hobby 플랜은 해당 시간대 안에서 실행). `CRON_SECRET` 필요.
- 최근 3일 동안 차단 목록에 오르거나 갱신된 주소를 `GetSuppressedDestination`으로 읽어 `SES_SUPPRESSION` 기록으로 저장(`record_email_feedback`).
  - 차단 목록에는 영구 반송·스팸 신고만 오른다. 반송은 `PERMANENT`/`SUPPRESSED`로 저장되어 회원 상태가 `BOUNCED`가 된다.
  - 같은 메시지 ID의 반송 기록(수동 `MAILBOX_IMPORT` 포함)이 이미 있으면 건너뛴다. 처리·해제한 보류가 다시 열리지 않는다.
  - 선정 메일 반송이면 기존 트리거가 `selection_email_holds` 보류를 만든다.
- 새 보류가 생기면 `ADMIN_INQUIRY_EMAIL`(제휴 문의 알림과 같은 수신자)로 알림 메일 1통. 메일 실패는 보류 저장에 영향 없음.
- 한계: 메일함 용량 초과 같은 일시 반송은 차단 목록에 오르지 않으므로 수동 등록이 필요하다.
- 차단 목록에 오른 주소는 SES가 이후 발송을 버린다. 선정 안내는 보류 칸의 카톡 발송을 사용한다.
- 테스트: `node --test scripts/test-ses-suppression.mjs`

## 운영 적용 순서 (승인 후)

1. `supabase/migrations/20261118093904_email_feedback.sql`을 적용한다.
   RLS를 켜고 anon/authenticated 권한은 모두 회수하며 service_role에만 필요한 권한을 부여한다.
   함수는 SECURITY INVOKER이고 service_role만 실행할 수 있다.
2. SES와 같은 리전의 SNS 토픽 `daonview-email-feedback`을 준비한다.
   SES 발신 identity가 있는 AWS 계정과 `daonview.com` / `master@daonview.com` ARN만
   SNS Publish를 할 수 있게 토픽 정책의 SourceAccount/SourceArn을 제한한다.
3. Vercel daonview production과 development에 `AWS_SES_FEEDBACK_TOPIC_ARN`을 설정한다.
   이 키는 허용할 토픽 ARN이고 인증키는 아니다. 개발 로컬에도 동일 키가 필요하다.
   SNS 요청·HTTPS 전달 사용량에 따른 비용 발생 가능성을 승인 범위에 포함한다.
4. 검증한 현재 코드를 운영 배포한다. 그 후 SNS HTTPS 구독을
   `https://daonview.com/api/webhooks/aws-ses`로 연결한다. RawMessageDelivery는 끈다.
   서명된 SubscriptionConfirmation만 허용하고 구독이 Confirmed인지 확인한다.
5. SES `daonview.com` 및 `master@daonview.com` identity의 Bounce/Complaint에 해당 토픽을 연결하고
   HeadersIn*Notifications를 켜 제목을 포함시킨다. FeedbackForwarding은 끄지 않는다.
   기존 설정이 있으면 덮어쓰기 전에 확인한다. Delivery 이벤트는 이 구독에 연결하지 않는다.
6. 확인한 과거 반송 JSON을 아래 명령으로 dry-run한 후 승인받은 자료만 적용한다.
   동일 자료를 재실행하면 중복 이벤트나 중복 상태 변경이 발생하지 않는다.
7. 관리자 로그인 상태에서 `/api/admin/email-feedback?page=1`로 내역과 한글 사유를 확인한다.
   비로그인은 401, 비관리자는 403이며 개인화 응답은 캐시하지 않는다.
8. Security Advisor 재점검으로 신규 RLS 비활성/공개 권한 문제가 없는지 확인한다.
   기존 경고는 이번 수정과 구분해 보고한다.

```bash
node scripts/import-email-feedback.mjs /path/to/reviewed-records.json
node scripts/import-email-feedback.mjs /path/to/reviewed-records.json --apply
node --test scripts/test-email-feedback.mjs
```

관리상 보류만 요청받은 과거 반송은 `--apply --record-only`로 저장해
회원의 email_subscription_status를 변경하지 않는다.

실제 환경에서는 SES mailbox simulator로 테스트한 반송 1건의 SNS 전달 성공, 이벤트 저장,
관리자 조회를 검증한다. 테스트에는 실제 회원 주소를 사용하지 않는다.
메일을 수신한 회원의 앱 내 알림·캠페인 선정·리뷰 상태는 변경하지 않는다.

## 복구

장애 시 SES의 새 SNS 연결만 원래 설정으로 되돌리고 메일 반송 전달은 유지한다.
신규 테이블과 기록은 즉시 삭제하지 않는다. 운영 회원의 이메일 상태 복구는 반영 전 상태와
수신 거부/신고의 후속 변경 여부를 대조한 뒤 별도 승인받는다. 상태를 일괄 SUBSCRIBED로 되돌리지 않는다.

## 확인된 과거 원인 (2026-11-18)

관리자 받은메일함 원문 6건: 비활성 메일함 3주소, 존재하지 않는 수신자 1주소,
Gmail 저장 공간 초과로 840분 후 만료 1주소, 기존 AWS suppression 주소 재발송 1건.
suppression 재발송은 위 비활성 주소 중 하나의 후속 사건이므로 서로 다른 수신자는 5명이다.
이는 메일함 앞 페이지에서 확인한 6건이며 전체 보관함의 전수조사 결과는 아니다.
과거 MAILBOX_IMPORT와 이후 SES_SNS가 같은 사건을 포함할 때 출처별 기록이 남을 수 있으며,
수동 자료의 중복 반영은 동일 event_key로 막는다.
과거 자료 중 Gmail 만료와 suppression 알림의 시각은 메일 화면에 표시된 분 단위 시각이다.
현재 로컬 AWS 자격증명으로 SNS ListTopics 요청은 AuthorizationError가 발생했다.
SNS 연결은 AWS 콘솔의 기존 권한 보유 계정으로 수행하거나 필요한 작업에 한정한 권한을
별도 승인받아야 한다. 이 기능을 위해 발송용 AWS 키에 SNS 관리 권한을 상시 부여하지 않는다.

## 선정 메일 반송의 관리상 보류

`20261118093905_selection_email_holds.sql`은 위 feedback 마이그레이션 이후 적용한다.
선정 상태 자체는 바꾸지 않는다. 새 발송은 신청 ID와 수신 주소를 먼저 기록하고 SES 접수 후
메시지 ID를 연결한다. 최신 선정 발송의 최종 Bounce만 관리상 보류하며 일시 반송도 포함한다.
스팸 신고는 기존 회원 수신 정책에 반영하지만 선정 보류 대상은 아니다.

관리자와 캠페인 소유 광고주는 공용 신청자 표의 ‘보류됨’ 탭에서 사유·주소·시각을 확인한다.
`GET /api/campaigns/:id/email-holds`도 같은 권한을 검사한다. 최초 페이지는 서버에서 조회하며,
새로고침 버튼 또는 창 복귀 시 최신 정보를 가져온다. 자동 주기 폴링은 하지 않는다.
관리자만 `POST /api/applications/:id/email-hold`로 해제할 수 있다. 입력은
`{ campaignId, holdId, reason }`이고, 변경된 보류 기록에 대한 해제는 409를 반환한다.
해제 시각·관리자·사유를 보존하며 발송 접수나 주소 변경만으로 자동 해제하지 않는다.
취소·거절·완료 신청은 활성 보류가 남아 있어도 목록에서 보류로 표시하지 않는다.
선정 인원·구매링크·리뷰 권한은 원래 상태를 사용하며, 보류 해제는 회원의 이메일 수신 차단을 해제하지 않는다.

이전/중복 이벤트는 해제된 동일 사건을 다시 열지 않는다. 새 최종 반송이 발생하면 새로운
보류 이력을 만든다. 재발송 접수 후 추적 저장이 실패하면 자동 재발송하지 않고 관리자에게
확인 필요 경고를 반환한다. 접수 전 기록 준비가 실패하면 메일을 발송하지 않는다.
동시 발송 순서는 신청 행 잠금과 발송 시도 ID로 정하며, 이벤트 저장·보류 반영은 트랜잭션이다.
피드백이 메시지 ID 연결보다 먼저 와도 메시지 ID 저장 후 다시 대조한다.

과거 기록은 먼저 반송 JSON을 저장한 다음, 확인한 매핑 JSON
`[{ "applicationId": 162, "campaignId": 44, "eventKey": "64자리 sha256" }]`을 준비한다.
같은 신청의 반송 여러 건 중 직접 확인한 대표 선정 반송 한 건만 선택한다.
`node scripts/import-selection-email-holds.mjs <파일>`로 dry-run하고 승인 후 `--apply`한다.
이미 신규 발송 추적이 시작된 신청에 과거 보류를 덮어쓰지 않는다.
메일 본문·캠페인·시각을 확인하지 않고 이메일 주소만으로 매핑을 생성하지 않는다.

검증: `node --test scripts/test-selection-email-holds.mjs scripts/test-selection-email-hold-api.mjs`.
SQL 테스트는 .env를 읽지 않는 별도 임시 PostgreSQL 클러스터에서 실제 마이그레이션을 실행하고
종료 후 클러스터를 삭제한다. PostgreSQL 개발 바이너리가 없으면 SQL 테스트는 명시적으로 skip된다.
운영 적용 후 같은 메시지 ID로 선정 테스트 반송→보류 탭→관리자 해제까지 실제 확인해야 한다.
DB 변경·과거 데이터 반영·환경변수 설정은 실행 직전 확인하며 운영 배포는 사용자 배포 요청 후 수행한다.
