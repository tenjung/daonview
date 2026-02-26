# Reviewer Link Distribution Migration

목표
- `productUrlIndividual=true` 캠페인에서 신청자 선정 시점에 개인 구매링크를 강제 배정한다.
- 링크 분배 알고리즘을 `최소사용우선`으로 통일한다.
- 링크 재할당 시 신청서 스냅샷을 갱신하고 즉시 재발송 트리거를 지원한다.

## 적용 순서
1. `/Volumes/data/Dev/daonview/docs/migrations/reviewer_link_distribution.sql` 실행
2. Supabase SQL Editor에서 RPC 생성 여부 확인
- `select_application_with_link`
- `reassign_application_link`
3. 애플리케이션 서버 배포

## 포함된 변경
1. 신규 테이블 `campaign_purchase_links`
- 캠페인 + 옵션 기준 링크풀 저장
- `option_key` 대문자 정규화 체크
- `(campaign_id, option_key, purchase_link_url)` 유니크 인덱스

2. `applications` 확장 컬럼
- `assigned_option_key`, `assigned_option_label`
- `assigned_purchase_link_id`, `assigned_purchase_link_url`
- `link_assigned_at`, `link_updated_at`

3. RPC 함수
- `select_application_with_link(...)`
  - 선정(SELECTED/APPROVED) + 링크 배정 원자 처리
  - `FOR UPDATE` 잠금 + 최소사용우선 + 동률 `id ASC`
- `reassign_application_link(...)`
  - 선정 상태 신청서의 링크 재할당

## 운영 체크리스트
1. `productUrlIndividual=true` 캠페인에서 옵션별 링크가 최소 1개 이상 등록되어 있는지 확인
2. 관리자/광고주 선정 API가 신규 RPC를 호출하는지 확인
3. 링크 재할당 후 이메일/알림톡 재발송 로그 확인

## 롤백 가이드(긴급)
- 신규 API 배포만 되돌리고 기존 클라이언트 선정 로직으로 임시 복귀 가능
- DB 롤백은 FK 참조를 고려해야 하므로 즉시 드롭 대신 `is_active=false` 방식 권장

