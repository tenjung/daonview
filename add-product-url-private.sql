-- ============================================
-- DB 스키마 수정 스크립트
-- 실행일: 2025-12-17
-- 목적: 체험상품 링크 비공개 설정 및 배송체험단 제품 정보 기능 추가
-- ============================================

-- campaigns 테이블에 배송체험단 제품 정보 관련 컬럼 추가
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS product_url text;

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS product_url_private boolean DEFAULT false;

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS product_name text;

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS product_options jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS product_price text;

-- 컬럼 설명 추가
COMMENT ON COLUMN public.campaigns.product_url IS 
'배송체험단 제품 URL';

COMMENT ON COLUMN public.campaigns.product_url_private IS 
'체험상품 링크 비공개 설정. true일 경우 선정된 사람들에게만 링크 표시';

COMMENT ON COLUMN public.campaigns.product_name IS 
'배송체험단 제품명';

COMMENT ON COLUMN public.campaigns.product_options IS 
'배송체험단 제품 옵션 정보 (JSON 배열)';

COMMENT ON COLUMN public.campaigns.product_price IS 
'배송체험단 제품 가격 (배송비 포함)';

-- ============================================
-- 검증 쿼리
-- ============================================

-- 컬럼 추가 확인
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaigns'
  AND table_schema = 'public'
  AND column_name IN ('product_url', 'product_url_private', 'product_name', 'product_options', 'product_price')
ORDER BY column_name;

-- ============================================
-- 롤백 스크립트 (문제 발생 시)
-- ============================================

/*
-- 컬럼 제거
ALTER TABLE public.campaigns
DROP COLUMN IF EXISTS product_url,
DROP COLUMN IF EXISTS product_url_private,
DROP COLUMN IF EXISTS product_name,
DROP COLUMN IF EXISTS product_options,
DROP COLUMN IF EXISTS product_price;
*/
