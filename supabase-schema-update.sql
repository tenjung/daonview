-- ============================================
-- 캠페인 등록 기능을 위한 campaigns 테이블 컬럼 추가
-- ============================================

-- 1. 기본 필드 추가
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS campaign_type text,  -- 'delivery', 'visit', 'press'
ADD COLUMN IF NOT EXISTS review_type text;    -- 리뷰 타입

-- 2. 매장/방문 정보 (JSON 또는 개별 필드)
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS stores jsonb DEFAULT '[]'::jsonb,  -- 매장 정보 배열
ADD COLUMN IF NOT EXISTS contact_phone text,                -- 연락처
ADD COLUMN IF NOT EXISTS visit_time text,                   -- 방문 시간 (available_time과 중복 가능)
ADD COLUMN IF NOT EXISTS visit_days jsonb DEFAULT '[]'::jsonb,  -- 방문 가능 요일
ADD COLUMN IF NOT EXISTS visit_notes text,                  -- 방문 관련 메모
ADD COLUMN IF NOT EXISTS experience_details text,           -- 체험 상세 내용
ADD COLUMN IF NOT EXISTS official_price text;               -- 정가

-- 3. 모집 정보
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS total_recruitment integer,  -- recruit_count와 동일하지만 명시적
ADD COLUMN IF NOT EXISTS reward_per_person integer;  -- 1인당 리워드

-- 4. 일정 정보
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS recruitment_start_date date,  -- 모집 시작일
ADD COLUMN IF NOT EXISTS first_selection_date date,    -- 1차 선정일
ADD COLUMN IF NOT EXISTS review_deadline date;         -- 리뷰 마감일

-- 5. 미션 가이드 정보
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS campaign_images jsonb DEFAULT '[]'::jsonb,  -- 캠페인 이미지 배열
ADD COLUMN IF NOT EXISTS text_length text,              -- 'free', 'short', 'medium', 'long', 'custom'
ADD COLUMN IF NOT EXISTS photo_count text,              -- '1', '3', '5', 'none'
ADD COLUMN IF NOT EXISTS video_required text,           -- 'yes', 'no'
ADD COLUMN IF NOT EXISTS mission_guide text,            -- 미션 가이드 텍스트
ADD COLUMN IF NOT EXISTS keywords jsonb DEFAULT '[]'::jsonb,         -- 필수 키워드 배열
ADD COLUMN IF NOT EXISTS prohibited_words jsonb DEFAULT '[]'::jsonb, -- 금지 키워드 배열
ADD COLUMN IF NOT EXISTS additional_notes text;         -- 추가 안내사항

-- 6. 결제 정보
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS payment_method text;  -- 'card', 'transfer'

-- 7. created_by를 user_id로도 참조 가능하도록 (선택사항)
-- 이미 created_by가 있으므로 별도 user_id 컬럼은 불필요
-- 코드에서 user_id 대신 created_by를 사용하도록 수정 권장

-- ============================================
-- 인덱스 추가 (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type ON public.campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_recruitment_start_date ON public.campaigns(recruitment_start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by);

-- ============================================
-- 코멘트 추가 (문서화)
-- ============================================
COMMENT ON COLUMN public.campaigns.campaign_type IS '캠페인 유형: delivery(배송), visit(방문), press(기자단)';
COMMENT ON COLUMN public.campaigns.stores IS '매장 정보 JSON 배열';
COMMENT ON COLUMN public.campaigns.visit_days IS '방문 가능 요일 배열';
COMMENT ON COLUMN public.campaigns.campaign_images IS '캠페인 이미지 URL 배열';
COMMENT ON COLUMN public.campaigns.keywords IS '필수 키워드 배열';
COMMENT ON COLUMN public.campaigns.prohibited_words IS '금지 키워드 배열';
