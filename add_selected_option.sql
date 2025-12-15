-- ============================================
-- Applications 테이블에 selected_option 컬럼 추가
-- ============================================

-- selected_option 컬럼 추가 (이미 있으면 스킵)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'selected_option'
    ) THEN
        ALTER TABLE applications ADD COLUMN selected_option TEXT;
        COMMENT ON COLUMN applications.selected_option IS '사용자가 선택한 제공 옵션';
    END IF;
END $$;

-- 확인 쿼리
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications'
ORDER BY ordinal_position;
