# 인증·데이터 조회 성능 개선 — 구현 및 검증 기록

기준: 2026-11-22, 기존 HEAD `ca58fa70e53225b13d2b42f5866a51e3c20ec009`.
운영 배포, DB 쓰기/마이그레이션, 환경변수·키 변경, 실제 이메일·카카오톡·결제 테스트는 수행하지 않았다.

## 공통 인증

- `getRequestAuth()`와 SSR Supabase client를 React `cache()`로 요청 안에서 공유한다. `requireDashboardRole()` 반환값은 기존 `{userId, role}`다.
- 역할 판정은 DB `profiles.role`만 사용한다. ADMIN/MASTER/SUPER_ADMIN 별칭은 유지한다. 프로필 누락·조회 오류는 명시적으로 실패한다.
- 관리자·광고주·인플루언서의 모든 page와 공통 캠페인 등록·임시저장·결제 콜백 page에 서버 역할 검사를 연결했다. 기존 Client Component는 같은 폴더의 `PageClient.tsx`로 옮겼다.
- 미들웨어는 세션 갱신·쿠키 전달·비로그인 차단을 담당하고 역할 DB 조회는 하지 않는다. 갱신 쿠키는 redirect에도 전달한다. 인증 서버 통신 실패는 503으로 구분한다.
- **미들웨어의 `getUser()`와 RSC의 `getUser()`는 서로 다른 실행 경계이므로 여전히 각각 호출된다.** 요청 캐시는 RSC 안의 중복을 합친다. 실제 HTTP 요청 수를 측정한 결과로 오인하면 안 된다.
- 클라이언트는 같은 사용자의 정상 SSR 프로필을 INITIAL_SESSION/SIGNED_IN에서 재사용한다. TOKEN_REFRESHED/USER_UPDATED/프로필 수정에서는 새로 읽는다. 동시 프로필 요청은 공유하고 로그아웃·계정 전환 뒤 응답은 세대 검사로 무시한다.
- 전역 클라이언트 프로필에서 계좌·주소·알 수 없는 필드를 제외했다. 해당 편집·배송·정산 화면은 기존 전용 조회를 유지한다. 프로필 오류 안내와 재시도 버튼을 제공한다.
- `getClaims()` 전환, JWT 서명키 변경, 영속 인증 캐시는 도입하지 않았다.

## 공개 데이터 캐시

| 대상 | 유효 기간 / 범위 | 태그 |
|---|---|---|
| 홈 배너 | 기존 60초, 공개 표시 결과 | `home-banner-data` |
| 캠페인 목록·관련 캠페인 | 30초, 공개 DTO·집계 | `public-campaigns` |
| 캠페인 상세·메타데이터 | 60초, 캠페인별 공개 DTO | `public-campaign:{id}` |
| 개인 신청·개별 배정 링크·정산 | 공용 캐시 제외 | 없음 |

공개 리뷰는 기존 주간 스냅샷 정책을 유지한다. 커뮤니티 상세는 영속 캐시를 추가하지 않고 메타데이터·본문의 원본 조회만 요청 단위로 공유한다. 조회수 변경은 기존 본문 경로에 둔다.

캐시에 넣기 전에 공개 필드를 선택하고 결제·쿠폰·임시저장 정보와 비공개 구매 링크 풀을 제거한다. 소유자/관리자의 비공개 캠페인 미리보기는 권한 검사 후 요청 안에서만 읽는다. 관련 캠페인도 raw JSON 대신 같은 공개 DTO를 사용한다.

`invalidatePublicCampaigns()`가 목록·홈·해당 상세 태그를 `{expire:0}`으로 만료시킨다. 등록·수정·임시저장·삭제·승인/마감/재개·연장·자동 연장·구매 링크 동기화·신청·취소·선정·재할당·리뷰 제출 성공 경로에 연결했다. 저장 성공 후 무효화 실패는 `cacheWarning`으로 구분하고 쓰기를 재시도하지 않는다.

브라우저의 관련 쓰기는 `/api/campaigns/save`, `/api/campaigns/delete`, `/api/applications/mutate`, `/api/applications/manage`로 이동했다. 입력 ID가 아닌 인증 세션으로 사용자/역할을 정하고 소유권을 확인한다. 관리자의 신청 상태 변경은 모든 대상의 캠페인 소유권을 확인한 뒤 서버 전용 client를 사용한다. 기존 RLS에는 광고주 소유자의 신청 UPDATE 허용 정책이 없기 때문이다. 개인 취소는 사용자와 PENDING 상태를 조건으로 한 DELETE여서 중간 상태 변경 시 409를 반환한다.

신청 가능 여부와 선정 인원은 캐시가 아닌 최신 DB를 조회한다. 선정/구매 링크 배정의 기존 서버 검증은 유지했다. 신청·선정 취소·리뷰 제출 등 본인 작업 뒤 해당 UI 데이터와 사이드바를 갱신한다.

공개 리뷰는 기존 7일 스냅샷 정책을 유지했다. 게시판 상세는 메타데이터와 본문 원본을 요청 단위로 공유한다. 조회수 쓰기는 기존 페이지 경로에서만 유지하며 메타데이터 조회에는 추가하지 않았다.

## 역할별 화면

- 인플루언서 요약·참여 캠페인·리뷰·찜, 광고주 요약·캠페인·리뷰는 서버 초기 데이터를 사용하고 마운트 직후 같은 목록 재조회를 생략한다. 기존 나의 문의 SSR 조회는 공통 인증으로 연결했다.
- 인플루언서 필터 목록과 상태별 건수, 관리자 캠페인 목록과 사이드바 집계를 병렬화했다.
- 관리자 사이드바는 SSR 집계를 재사용한다. 보이는 탭에서 30초 갱신하고 숨겨진 탭에서는 조회하지 않는다. 작업 성공 이벤트는 즉시 갱신하며 실행 중이면 완료 후 한 번 더 갱신한다.
- 캠페인 테이블은 `CampaignDataTable`과 기존 역할별 래퍼를 유지한다. 결제·정산 데이터는 공용 캐시하지 않는다.
- 새 요청·계정 전환·화면 이탈 뒤 응답은 무시한다. 온보딩과 기존 알림 생성은 SSR/prefetch 중 쓰기를 하지 않고 클라이언트에서 유지한다.

## 실제 확인과 남은 검증

| 항목 | 결과 |
|---|---|
| 인증·역할·만료 세션·메타데이터 위조·프로필 실패·계정 전환·캐시·소유권·조건부 취소·기존 승인/알림 회귀 | 격리 fixture 테스트 53개 통과. 실제 전송/DB 쓰기 없음 |
| TypeScript | `npx tsc --noEmit` 통과 |
| 변경 파일 ESLint | 기존 코드/이동 전 page와 비교. 기존 오류 43건이 남아 있으며 신규 오류 0건 |
| 프로덕션 빌드 | `npm run build` 통과. 운영 배포 아님 |
| 로컬 브라우저 | 메인→목록→상세, 스켈레톤 후 본문, 가이드 표시, 콘솔 오류 없음, 390px 상세 가로 넘침 없음 |
| 비로그인 직접 접근 | 관리자·광고주·인플루언서 모두 로그인으로 이동 |
| 로그인 상태 역할별 5회 성능 비교 | **미완료**. 로컬에 인증된 세 역할 세션이 없어서 동일 계정·환경 기준 전후 중앙값을 확보하지 못함 |
| 실제 JWT/RLS 교차 접근·갱신 세션·프로필 편집 후 재표시 | **미완료**. 단위 fixture로 대체 통과 처리하지 않음 |
| 운영 쓰기 후 홈/목록/상세/집계 일치 | **미완료**. 격리 DB/세 역할 테스트 세션에서 실증 필요 |

클릭→스켈레톤과 클릭→본문, 인증/프로필/목록의 실제 HTTP 요청 수를 동일 환경에서 최초 접속과 내부 이동 각 5회 측정해야 한다. 본문 표시 중앙값이 10% 이상 악화되면 해당 단계 원인을 해결하거나 되돌린다. 지금은 개선율을 제시할 근거가 없다.

## 배포 전 해결해야 할 기존 RLS 문제

운영 DB를 **읽기만 하여** `pg_policies`와 역할 권한, Security Advisor를 확인했다.

- `public.profiles`: `Allow All Profiles` 정책이 `FOR ALL USING true WITH CHECK true`다.
- `public.campaigns`: `Allow All Campaigns` 정책이 같은 형태다.
- 두 테이블 모두 anon 역할에 SELECT/INSERT/UPDATE/DELETE grant가 있다.
- `applications_select_policy`는 CANCELLED가 아닌 신청을 공개 읽기로 허용한다. 개별 배정 링크 등 민감 컬럼의 직접 조회 가능 범위도 별도 점검해야 한다.

서버의 소유권 검사만으로 직접 Data API 접근을 막을 수 없으며, profiles.role을 신뢰할 수 있는 DB 경계도 확인해야 한다. 따라서 **사이트 전체 권한 안전성은 통과하지 않았다.** DB 변경은 이번 승인 범위에서 제외되어 실행하지 않았다.

권장 후속 순서: 공개/개인 컬럼과 기존 브라우저 호출 목록 확정 → 무제한 ALL 정책 제거와 최소 권한 설계(프로필 role 변경 차단 포함) → 격리 계정으로 역할/소유권/공개 집계/프로필 편집 회귀 → 사용자 승인 후 DB 변경 → Security Advisor 및 실제 JWT 재검증. RLS가 켜져 있다는 사실만으로 안전하다고 판단하지 않는다.

Advisor에서는 rls_disabled_in_public은 나오지 않았으나 search_path, SECURITY DEFINER 실행 권한 등의 기존 경고가 있다. 운영 전용 테이블의 RLS/no-policy는 서버 전용 접근 설계와 함께 판단해야 한다.

## 기존 중복 정의

`constants/role.ts`와 `campaignPermissions.ts`에 관리자 별칭/역할 정규화 정의가 중복되어 있다. 이번 작업은 외부 반환 계약과 별칭 동작을 유지했고, 무관한 권한 구조 통합은 함께 수행하지 않았다. `CampaignTableClient.tsx`는 현재 호출부가 없는 예전 별도 운영 테이블로 확인했다. 실제 운영 화면은 공통 테이블 래퍼 구조를 사용한다.


## 검증 재실행

```bash
node --test scripts/test-auth-middleware.mjs scripts/test-request-auth.mjs scripts/test-auth-store.mjs scripts/test-campaign-cache.mjs scripts/test-dashboard-data.mjs scripts/test-application-mutations.mjs scripts/test-selection-email-hold-api.mjs scripts/test-review-approval.mjs tests/campaign-actions.test.mjs tests/campaign-reminders.test.mjs
npx tsc --noEmit
npm run build
```

테스트의 통신·DB·메일 경계는 fixture로 대체되어 있다. 위 테스트 통과는 운영 RLS나 실제 알림 도착을 검증한 의미가 아니다.
