-- ============================================
-- DAONVIEW - 최종 적용 SQL
-- 기존 테이블 구조를 확인한 후 작성됨
-- ============================================

-- ============================================
-- 1. FAVORITES 테이블 생성 (신규)
-- ============================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 중복 방지: 한 사용자가 같은 캠페인을 여러 번 저장할 수 없음
    CONSTRAINT unique_user_campaign UNIQUE(user_id, campaign_id)
);

-- 인덱스 생성 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_campaign_id ON favorites(campaign_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Row Level Security 활성화
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 관심 캠페인만 조회 가능
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 관심 캠페인만 추가 가능
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
CREATE POLICY "Users can insert their own favorites"
    ON favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 관심 캠페인만 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
CREATE POLICY "Users can delete their own favorites"
    ON favorites FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================
-- 2. APPLICATIONS 테이블 RLS 정책 추가
-- (테이블은 이미 존재하므로 정책만 추가)
-- ============================================

-- Row Level Security 활성화 (이미 되어있을 수 있음)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (충돌 방지)
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON applications;

-- RLS 정책: 사용자는 자신의 신청 내역만 조회 가능
CREATE POLICY "Users can view their own applications"
    ON applications FOR SELECT
    USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 신청만 추가 가능
CREATE POLICY "Users can insert their own applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 신청만 수정 가능
CREATE POLICY "Users can update their own applications"
    ON applications FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS 정책: 관리자는 모든 신청 내역 조회 가능
CREATE POLICY "Admins can view all applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS 정책: 관리자는 모든 신청 내역 수정 가능 (승인/거절)
CREATE POLICY "Admins can update all applications"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );


-- ============================================
-- 3. PROFILES 테이블 컬럼 추가 (없는 경우만)
-- ============================================

-- phone_number 컬럼 추가 (이미 있으면 스킵)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone_number TEXT;
    END IF;
END $$;

-- sns_url 컬럼 추가 (이미 있으면 스킵)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'sns_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN sns_url TEXT;
    END IF;
END $$;

-- selected_option 컬럼 추가 (applications 테이블)
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


-- ============================================
-- 4. 인덱스 추가 (성능 최적화)
-- ============================================

-- Applications 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);


-- ============================================
-- 5. 확인 쿼리 (실행 후 결과 확인용)
-- ============================================

-- 아래 쿼리들은 별도로 실행해서 확인하세요
/*

-- Favorites 테이블 확인
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'favorites'
ORDER BY ordinal_position;

-- Applications 테이블 확인
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications'
ORDER BY ordinal_position;

-- RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('favorites', 'applications')
ORDER BY tablename, policyname;

-- 인덱스 확인
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('favorites', 'applications')
ORDER BY tablename, indexname;

*/
