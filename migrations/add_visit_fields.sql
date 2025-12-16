-- Add business hours, available time, and reservation method fields to campaigns table

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS business_hours TEXT,
ADD COLUMN IF NOT EXISTS available_time TEXT,
ADD COLUMN IF NOT EXISTS reservation_method TEXT;

-- Add comments
COMMENT ON COLUMN campaigns.business_hours IS '영업시간 및 휴무일 (예: 매일 10:00~22:00, 연중무휴)';
COMMENT ON COLUMN campaigns.available_time IS '체험 가능 시간 (예: 평일 14:00 이후, 주말 불가)';
COMMENT ON COLUMN campaigns.reservation_method IS '예약 방법 (예: 방문 2일 전 문자 예약)';
