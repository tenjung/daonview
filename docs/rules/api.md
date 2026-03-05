# 다온뷰 API 문제 정리 (현재 기준)

## 0) 스캔 범위/팩트
- 기준 경로: `src/app/api/**/route.ts`
- 확인된 API 라우트 수: **41개**
- 현재 파일 기준으로 정리했으며, 추측은 배제함.

## 1) 현재 로직의 핵심 문제 (Root Cause)

### 1-1. 응답 스키마가 통일되지 않음
- 어떤 API는 `{ success, data }`, 어떤 API는 `{ error }`, 어떤 API는 `{ error, details }`, 어떤 API는 `redirect`를 반환.
- 동일한 실패 케이스라도 메시지 키/형식이 다름.
- 결과: 프론트에서 엔드포인트마다 예외 처리가 분기되어 유지보수 비용이 증가함.

근거 예시:
- `src/app/api/scrape-blog/route.ts` → `{ success: true, data }`, 실패 시 `{ error }`
- `src/app/api/crawl-blog/route.ts` → `{ success, message, data }`, 실패 시 `{ error, details }`
- `src/app/api/unsubscribe/route.ts` → 성공 시 redirect, 실패 시 JSON

### 1-2. 인증/권한 검증 방식이 분산됨
- 인증 방식이 라우트별로 제각각임:
- Supabase 세션 기반
- `authorization` 헤더 + `CRON_SECRET`
- 사실상 검증이 약한 공개형 POST
- 결과: 보안 정책을 중앙에서 통제하기 어렵고, 신규 API가 같은 기준을 따르기 어려움.

근거 예시:
- `src/app/api/admin/generate-column/route.ts` (세션 + ADMIN role)
- `src/app/api/cron/generate-column/route.ts` (`CRON_SECRET`)
- `src/app/api/send-email/route.ts` (요청 body 기반 처리)

### 1-3. 유사 기능 엔드포인트가 분리되어 중복됨
- 기능이 겹치거나 책임 경계가 불명확한 API가 공존함.
- 결과: 버그 수정/정책 변경 시 한쪽만 수정되는 불일치 리스크가 큼.

중복/유사 후보:
- 블로그 계열: `crawl-blog` vs `scrape-blog`
- 칼럼 생성: `admin/generate-column` vs `cron/generate-column`
- 메일 발송: `send-email` vs `send-approval-email` (목적 차이는 있으나 규약은 분리됨)

### 1-4. 엔드포인트 네이밍이 리소스 중심이 아님
- `hide-review`, `update-review`, `fetch-product-info`처럼 동사형 엔드포인트가 많음.
- App Router API에서도 가능은 하지만, 리소스/행위 경계가 흐려져 API 계약 관리가 어려워짐.

### 1-5. 상태값/타입값 대문자 규약은 일부 지켜지지만 API 레벨 표준 문서가 없음
- 코드 곳곳에 `.toUpperCase()` 비교가 존재해 현장 대응은 하고 있음.
- 하지만 API 명세에서 “입력 허용값/정규화 규칙/에러 코드”가 고정되어 있지 않음.
- 결과: 클라이언트별로 임의 처리 발생 가능.

---

## 2) 수정 방향 (근본 해결 기준)

### 2-1. 응답 계약(Contract) 단일화
모든 API는 아래 형식 중 하나만 사용:

성공:
```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "string"
  }
}
```

실패:
```json
{
  "ok": false,
  "error": {
    "code": "UPPERCASE_ERROR_CODE",
    "message": "사용자 노출 메시지",
    "details": {}
  },
  "meta": {
    "requestId": "string"
  }
}
```

규칙:
- `success`/`message`/`error` 혼용 금지 → `ok` + `data|error`로 고정
- `error.code`는 반드시 `UPPERCASE_STRING`
- 내부 디버깅 정보는 `details`에만 제한적으로 포함

### 2-2. 인증/권한 체크를 공통 유틸로 강제
- `requireUser()`, `requireAdmin()`, `requireCronSecret()` 같은 서버 유틸로 통합.
- 라우트 내부에서 인증 로직 직접 구현 금지.

### 2-3. 중복 API 통합
- `crawl-blog`와 `scrape-blog`는 책임을 분리하거나 하나로 통합:
- 옵션 A: `scrape-blog`(수집) + `blog-stats/upsert`(저장)로 분리
- 옵션 B: `blog/scrape` 단일 API로 통합 후 모드 파라미터 사용
- `admin/generate-column`과 `cron/generate-column`은 공통 서비스 함수 1개를 사용하고 트리거만 분리.

### 2-4. 리소스 중심 URI로 재정렬
- 예: `update-review` -> `reviews/[id] (PATCH)`
- 예: `hide-review` -> `reviews/[id]/visibility (PATCH)`
- 예: `fetch-product-info` -> `products/resolve (POST)` 또는 `products/[id] (GET)`

### 2-5. DB 무결성 규칙 API 명세 반영
- 모든 상태/타입 필드는 입력 즉시 정규화:
- `String(value).toUpperCase()`
- 허용 enum 외 값은 `400 + INVALID_*` 코드로 거절.

---

## 3) 적용 계획 (문서 기준 우선순위)

### P0 (즉시)
- 공통 응답 규약 확정 (`ok/data/error`)
- 공통 에러 코드 테이블 정의
- 인증/권한 유틸 표준 확정

### P1
- 중복 API 통합 설계 확정
- 동사형 엔드포인트를 리소스형으로 매핑한 마이그레이션 표 작성

### P2
- API별 Request/Response 스키마(Zod 또는 TS 타입) 문서화
- 회귀 체크리스트(권한, 상태값 정규화, 에러코드 일치) 추가

---

## 4) 우선 점검 대상 파일
- `src/app/api/crawl-blog/route.ts`
- `src/app/api/scrape-blog/route.ts`
- `src/app/api/admin/generate-column/route.ts`
- `src/app/api/cron/generate-column/route.ts`
- `src/app/api/send-email/route.ts`
- `src/app/api/send-approval-email/route.ts`
- `src/app/api/unsubscribe/route.ts`

---

## 5) 결론 (직설)
- 지금 문제의 본질은 “기능 부족”이 아니라 “계약 부재”다.
- 라우트 개수(41개)보다 더 위험한 것은 응답/권한/네이밍 표준이 분산된 상태다.
- 먼저 API 계약을 고정하고, 그다음 중복 라우트를 합쳐야 유지보수 비용이 줄어든다.
