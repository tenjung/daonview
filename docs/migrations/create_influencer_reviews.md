# 인플루언서 평가 시스템 DB 마이그레이션

## 개요
광고주와 관리자가 인플루언서에 대한 평가를 공유하는 시스템입니다.

## 1. 테이블 생성

Supabase SQL Editor에서 실행하세요.

```sql
-- 인플루언서 평가 테이블 생성
CREATE TABLE IF NOT EXISTS influencer_reviews (
    id BIGSERIAL PRIMARY KEY,
    influencer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
    rating_tags TEXT[] NOT NULL DEFAULT '{}',
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 제약조건: 같은 캠페인에서 같은 리뷰어가 중복 평가 방지
    CONSTRAINT unique_review_per_campaign UNIQUE(influencer_id, reviewer_id, campaign_id)
);

-- 인덱스 생성
CREATE INDEX idx_influencer_reviews_influencer_id ON influencer_reviews(influencer_id);
CREATE INDEX idx_influencer_reviews_reviewer_id ON influencer_reviews(reviewer_id);
CREATE INDEX idx_influencer_reviews_campaign_id ON influencer_reviews(campaign_id);
CREATE INDEX idx_influencer_reviews_created_at ON influencer_reviews(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_influencer_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_influencer_reviews_updated_at
    BEFORE UPDATE ON influencer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_influencer_reviews_updated_at();

-- 코멘트 추가
COMMENT ON TABLE influencer_reviews IS '인플루언서 평가 및 메모 (광고주/관리자 공유)';
COMMENT ON COLUMN influencer_reviews.influencer_id IS '평가 대상 인플루언서';
COMMENT ON COLUMN influencer_reviews.reviewer_id IS '평가 작성자 (광고주 또는 관리자)';
COMMENT ON COLUMN influencer_reviews.campaign_id IS '평가가 작성된 캠페인 (NULL 가능)';
COMMENT ON COLUMN influencer_reviews.rating_tags IS '평가 태그 배열 (예: ["리뷰가 빨라요", "사진이 이뻐요"])';
COMMENT ON COLUMN influencer_reviews.comment IS '상세 메모';
```

## 2. RLS (Row Level Security) 설정

```sql
-- RLS 활성화
ALTER TABLE influencer_reviews ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 읽기 가능 (공유 목적)
CREATE POLICY "Anyone can view reviews"
    ON influencer_reviews
    FOR SELECT
    USING (true);

-- 정책 2: 광고주와 관리자만 작성 가능
CREATE POLICY "Advertisers and admins can create reviews"
    ON influencer_reviews
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('ADVERTISER', 'ADMIN')
        )
    );

-- 정책 3: 본인이 작성한 평가만 수정 가능
CREATE POLICY "Users can update their own reviews"
    ON influencer_reviews
    FOR UPDATE
    USING (reviewer_id = auth.uid())
    WITH CHECK (reviewer_id = auth.uid());

-- 정책 4: 본인이 작성한 평가만 삭제 가능
CREATE POLICY "Users can delete their own reviews"
    ON influencer_reviews
    FOR DELETE
    USING (reviewer_id = auth.uid());
```

## 3. 평가 태그 종류

### 긍정 태그 (초록색)
- `리뷰가 빨라요`
- `사진이 이뻐요`
- `소통이 원활해요`
- `성실해요`
- `퀄리티가 좋아요`

### 주의 태그 (노란색)
- `리뷰등록이 느려요`
- `리뷰지연발생`
- `소통이 느려요`

### 부정 태그 (빨간색)
- `연락두절 발생`
- `약속 미이행`
- `리뷰 미작성`

## 4. 테스트 데이터

```sql
-- 테스트 평가 데이터 추가
INSERT INTO influencer_reviews (influencer_id, reviewer_id, campaign_id, rating_tags, comment)
SELECT 
    (SELECT id FROM profiles WHERE role = 'INFLUENCER' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'ADVERTISER' LIMIT 1),
    (SELECT id FROM campaigns LIMIT 1),
    ARRAY['리뷰가 빨라요', '사진이 이뻐요'],
    '리뷰를 정말 빠르게 작성해주셨고, 사진 퀄리티도 훌륭했습니다. 다음에도 함께 하고 싶어요!'
ON CONFLICT DO NOTHING;
```

## 5. 확인 쿼리

```sql
-- 특정 인플루언서의 모든 평가 조회
SELECT 
    ir.*,
    reviewer.nickname as reviewer_name,
    reviewer.role as reviewer_role,
    c.title as campaign_title
FROM influencer_reviews ir
LEFT JOIN profiles reviewer ON ir.reviewer_id = reviewer.id
LEFT JOIN campaigns c ON ir.campaign_id = c.id
WHERE ir.influencer_id = 'YOUR_INFLUENCER_ID'
ORDER BY ir.created_at DESC;

-- 평가 통계
SELECT 
    p.id,
    p.nickname,
    COUNT(ir.id) as total_reviews,
    ARRAY_AGG(DISTINCT tag) as all_tags
FROM profiles p
LEFT JOIN influencer_reviews ir ON p.id = ir.influencer_id
CROSS JOIN LATERAL UNNEST(ir.rating_tags) as tag
WHERE p.role = 'INFLUENCER'
GROUP BY p.id, p.nickname;
```
