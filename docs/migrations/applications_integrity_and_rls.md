# Applications Integrity + RLS Hardening

목표
- 신청 상태값을 대문자 규격으로 고정한다.
- 동일 유저가 동일 캠페인에 중복 신청되지 않도록 보장한다.
- 신청(INSERT)은 `INFLUENCER`만 가능하도록 강제한다.
- 조회/취소는 필요한 주체(본인, 캠페인 생성자, ADMIN)만 허용한다.

주의
- 아래 SQL은 운영 데이터에 영향을 준다.
- 실행 전 백업 또는 최소 스냅샷 확보를 권장한다.

## 1) 사전 점검 (읽기 전용)

```sql
-- 1-1. status 값 분포 확인
SELECT UPPER(status) AS status_upper, COUNT(*) AS cnt
FROM public.applications
GROUP BY UPPER(status)
ORDER BY cnt DESC;

-- 1-2. 유저/캠페인 중복 신청 확인
SELECT campaign_id, user_id, COUNT(*) AS dup_count
FROM public.applications
GROUP BY campaign_id, user_id
HAVING COUNT(*) > 1
ORDER BY dup_count DESC;

-- 1-3. 인플루언서 외 신청 데이터 확인
SELECT a.id, a.campaign_id, a.user_id, UPPER(COALESCE(p.role, '')) AS role, a.status, a.created_at
FROM public.applications a
LEFT JOIN public.profiles p ON p.id = a.user_id
WHERE UPPER(COALESCE(p.role, '')) <> 'INFLUENCER'
ORDER BY a.created_at DESC;
```

## 2) 데이터 정규화 + 제약 강화

```sql
BEGIN;

-- 2-1. 상태값 대문자 정규화
UPDATE public.applications
SET status = UPPER(status)
WHERE status IS NOT NULL
  AND status <> UPPER(status);

-- 2-2. 비정상 상태값 차단
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_allowed_chk;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_allowed_chk
  CHECK (status IN ('PENDING', 'APPROVED', 'SELECTED', 'REJECTED', 'COMPLETED', 'CANCELLED'));

-- 2-3. 대문자 규격 강제
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_uppercase_chk;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_uppercase_chk
  CHECK (status = UPPER(status));

-- 2-4. 중복 신청 차단 (CANCELLED는 예외)
-- 이미 존재하는 partial unique index가 있으면 재사용한다.
-- 이 프로젝트는 `unique_user_campaign_application` 인덱스가 동일 역할을 수행한다.
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_campaign_application
  ON public.applications (user_id, campaign_id)
  WHERE status <> 'CANCELLED';

COMMIT;
```

## 3) RLS 정책 정리 및 재생성

```sql
BEGIN;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 기존 정책 이름을 모르는 상태에서도 전체 정리
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.applications', pol.policyname);
  END LOOP;
END $$;

-- 조회: 본인 신청, 캠페인 생성자, ADMIN 허용
CREATE POLICY applications_select_policy
ON public.applications
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = applications.campaign_id
      AND c.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND UPPER(COALESCE(p.role, '')) = 'ADMIN'
  )
);

-- 신청: 인플루언서 본인만 가능
CREATE POLICY applications_insert_policy
ON public.applications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND UPPER(COALESCE(p.role, '')) = 'INFLUENCER'
  )
);

-- 수정: 본인(PENDING 상태) 또는 ADMIN
CREATE POLICY applications_update_policy
ON public.applications
FOR UPDATE
USING (
  (auth.uid() = user_id AND status = 'PENDING')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND UPPER(COALESCE(p.role, '')) = 'ADMIN'
  )
)
WITH CHECK (
  (auth.uid() = user_id AND status = 'PENDING')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND UPPER(COALESCE(p.role, '')) = 'ADMIN'
  )
);

-- 삭제: 본인(PENDING 상태) 또는 ADMIN
CREATE POLICY applications_delete_policy
ON public.applications
FOR DELETE
USING (
  (auth.uid() = user_id AND status = 'PENDING')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND UPPER(COALESCE(p.role, '')) = 'ADMIN'
  )
);

COMMIT;
```

## 4) 운영 데이터 정리(선택)

아래는 인플루언서 외 신청 데이터를 제거하는 강한 정리안이다. 실행 전 반드시 검토한다.

```sql
-- 필요 시에만 실행
DELETE FROM public.applications a
USING public.profiles p
WHERE p.id = a.user_id
  AND UPPER(COALESCE(p.role, '')) <> 'INFLUENCER';
```

## 5) 사후 검증

```sql
-- 중복 신청 재확인
SELECT campaign_id, user_id, COUNT(*) AS dup_count
FROM public.applications
GROUP BY campaign_id, user_id
HAVING COUNT(*) > 1;

-- 정책 확인
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'applications'
ORDER BY policyname;
```
