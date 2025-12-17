-- ============================================
-- DB 스키마 수정 스크립트
-- 실행일: 2025-12-17
-- 목적: 관리자 대시보드 광고주 정보 표시 기능 지원
-- ============================================

-- 1. campaigns.created_by FK 수정
-- 기존: auth.users 참조 → 수정: public.profiles 참조
ALTER TABLE public.campaigns
DROP CONSTRAINT IF EXISTS campaigns_created_by_fkey;

ALTER TABLE public.campaigns
ADD CONSTRAINT campaigns_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON CONSTRAINT campaigns_created_by_fkey ON public.campaigns IS 
'캠페인 생성자를 profiles 테이블과 연결. JOIN 쿼리 지원을 위해 profiles 참조로 변경';

-- 2. profiles에 name 컬럼 추가 (선택사항)
-- nickname과 별도로 실명을 저장할 수 있도록 함
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name text;

COMMENT ON COLUMN public.profiles.name IS '사용자 실명 (nickname과 별도)';

-- 3. profiles.role 기본값을 대문자로 변경
-- 코드에서 'ADVERTISER', 'INFLUENCER', 'ADMIN' 사용
ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'INFLUENCER'::text;

-- 4. 기존 데이터의 role을 대문자로 변경 (필요시)
-- 기존에 소문자로 저장된 role 값이 있다면 대문자로 변환
UPDATE public.profiles
SET role = UPPER(role)
WHERE role IN ('influencer', 'advertiser', 'admin');

-- 5. role 값 검증을 위한 CHECK 제약 조건 추가 (선택사항)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('INFLUENCER', 'ADVERTISER', 'ADMIN'));

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS 
'role 값은 INFLUENCER, ADVERTISER, ADMIN 중 하나여야 함 (대문자)';

-- ============================================
-- 검증 쿼리
-- ============================================

-- 1. FK 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'campaigns'
  AND kcu.column_name = 'created_by';

-- 2. profiles 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. role 값 분포 확인
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- ============================================
-- 롤백 스크립트 (문제 발생 시)
-- ============================================

/*
-- FK를 원래대로 되돌리기
ALTER TABLE public.campaigns
DROP CONSTRAINT IF EXISTS campaigns_created_by_fkey;

ALTER TABLE public.campaigns
ADD CONSTRAINT campaigns_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- role 기본값을 소문자로 되돌리기
ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'influencer'::text;

-- CHECK 제약 조건 제거
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;
*/
