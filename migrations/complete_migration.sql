-- ============================================
-- DAONVIEW 데이터베이스 통합 마이그레이션
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 한 번에 실행하세요
-- 경로: Supabase Dashboard > SQL Editor > New Query
-- ============================================

-- 1. applications 테이블에 application_message 컬럼 추가
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS application_message TEXT;

COMMENT ON COLUMN applications.application_message IS '리뷰어가 작성한 자유 메시지';

-- 2. campaigns 테이블에 region, category 컬럼 추가
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

COMMENT ON COLUMN campaigns.region IS '방문형 캠페인의 지역 정보 (예: 서울/강남구, 대구/수성구)';
COMMENT ON COLUMN campaigns.category IS '배송형 캠페인의 카테고리 정보';

-- 3. campaigns 테이블에 방문형 캠페인 관련 필드 추가
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS business_hours TEXT,
ADD COLUMN IF NOT EXISTS available_time TEXT,
ADD COLUMN IF NOT EXISTS reservation_method TEXT;

COMMENT ON COLUMN campaigns.business_hours IS '영업시간 및 휴무일 (예: 매일 10:00~22:00, 연중무휴)';
COMMENT ON COLUMN campaigns.available_time IS '체험 가능 시간 (예: 평일 14:00 이후, 주말 불가)';
COMMENT ON COLUMN campaigns.reservation_method IS '예약 방법 (예: 방문 2일 전 문자 예약)';

-- 4. campaigns 테이블의 기존 필드 확인 및 추가 (누락된 경우)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS store_address TEXT,
ADD COLUMN IF NOT EXISTS naver_map_url TEXT,
ADD COLUMN IF NOT EXISTS sub_image_1 TEXT,
ADD COLUMN IF NOT EXISTS sub_image_2 TEXT,
ADD COLUMN IF NOT EXISTS is_always BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS campaign_options JSONB,
ADD COLUMN IF NOT EXISTS provision TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN campaigns.store_name IS '업체명 (상호명)';
COMMENT ON COLUMN campaigns.store_address IS '업체 주소';
COMMENT ON COLUMN campaigns.naver_map_url IS '네이버 플레이스 URL';
COMMENT ON COLUMN campaigns.sub_image_1 IS '서브 이미지 1';
COMMENT ON COLUMN campaigns.sub_image_2 IS '서브 이미지 2';
COMMENT ON COLUMN campaigns.is_always IS '상시모집 여부';
COMMENT ON COLUMN campaigns.campaign_options IS '캠페인 옵션 (선택 항목)';
COMMENT ON COLUMN campaigns.provision IS '제공 내용';
COMMENT ON COLUMN campaigns.created_by IS '캠페인 생성자 (광고주)';

-- ============================================
-- 마이그레이션 완료!
-- ============================================
-- 실행 후 아래 쿼리로 테이블 구조를 확인하세요:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'campaigns' 
-- ORDER BY ordinal_position;
-- ============================================
