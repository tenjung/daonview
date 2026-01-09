# 인플루언서 통계 시스템 DB 마이그레이션

## 개요
인플루언서의 블로그/SNS 활동 지표를 저장하고 영향력 점수를 산정하는 시스템입니다.

## 1. 테이블 생성

Supabase SQL Editor에서 실행하세요.

```sql
-- 인플루언서 통계 테이블 생성
CREATE TABLE IF NOT EXISTS influencer_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL DEFAULT 'NAVER_BLOG',
    blog_url TEXT NOT NULL,
    
    -- 기본 지표
    visitor_today INTEGER DEFAULT 0,
    visitor_yesterday INTEGER DEFAULT 0,
    visitor_total INTEGER DEFAULT 0,
    neighbor_count INTEGER DEFAULT 0,
    
    -- 활동 지표 (최근 10개 포스팅 평균)
    avg_likes DECIMAL(10,2) DEFAULT 0,
    avg_comments DECIMAL(10,2) DEFAULT 0,
    avg_engagement DECIMAL(10,2) DEFAULT 0, -- (좋아요 + 댓글) / 2
    
    -- 컨텐츠 분석
    main_categories TEXT[] DEFAULT '{}',
    category_stats JSONB DEFAULT '{}',
    recent_posts JSONB DEFAULT '[]',
    
    -- 종합 점수 (0-100)
    influence_score INTEGER DEFAULT 0,
    
    -- 메타 정보
    last_crawled_at TIMESTAMPTZ,
    crawl_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    crawl_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 제약조건: 사용자당 플랫폼별 1개의 통계만 유지
    CONSTRAINT unique_user_platform UNIQUE(user_id, platform)
);

-- 인덱스 생성
CREATE INDEX idx_influencer_stats_user_id ON influencer_stats(user_id);
CREATE INDEX idx_influencer_stats_platform ON influencer_stats(platform);
CREATE INDEX idx_influencer_stats_influence_score ON influencer_stats(influence_score DESC);
CREATE INDEX idx_influencer_stats_last_crawled ON influencer_stats(last_crawled_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_influencer_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_influencer_stats_updated_at
    BEFORE UPDATE ON influencer_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_influencer_stats_updated_at();

-- 코멘트 추가
COMMENT ON TABLE influencer_stats IS '인플루언서 블로그/SNS 활동 통계';
COMMENT ON COLUMN influencer_stats.visitor_today IS '오늘 방문자 수';
COMMENT ON COLUMN influencer_stats.visitor_yesterday IS '어제 방문자 수 (전날 today 값 저장)';
COMMENT ON COLUMN influencer_stats.visitor_total IS '전체 방문자 수';
COMMENT ON COLUMN influencer_stats.neighbor_count IS '이웃 수 (구독자)';
COMMENT ON COLUMN influencer_stats.avg_likes IS '최근 10개 포스팅 평균 좋아요';
COMMENT ON COLUMN influencer_stats.avg_comments IS '최근 10개 포스팅 평균 댓글';
COMMENT ON COLUMN influencer_stats.avg_engagement IS '평균 참여도 (좋아요+댓글)/2';
COMMENT ON COLUMN influencer_stats.influence_score IS '종합 영향력 점수 (0-100)';
```

## 2. RLS (Row Level Security) 설정

```sql
-- RLS 활성화
ALTER TABLE influencer_stats ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can view stats"
    ON influencer_stats
    FOR SELECT
    USING (true);

-- 정책 2: 시스템만 생성/수정 가능 (서버 사이드에서만)
CREATE POLICY "Service role can manage stats"
    ON influencer_stats
    FOR ALL
    USING (auth.role() = 'service_role');
```

## 3. 영향력 점수 산정 로직

```sql
-- 영향력 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_influence_score(
    p_visitor_today INTEGER,
    p_visitor_total INTEGER,
    p_neighbor_count INTEGER,
    p_avg_likes DECIMAL,
    p_avg_comments DECIMAL
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_daily_score INTEGER := 0;
    v_total_score INTEGER := 0;
    v_neighbor_score INTEGER := 0;
    v_engagement_score INTEGER := 0;
BEGIN
    -- 1. 일 방문자 점수 (0-25점)
    v_daily_score := LEAST(25, (p_visitor_today / 100) * 25);
    
    -- 2. 전체 방문자 점수 (0-25점)
    v_total_score := LEAST(25, (p_visitor_total / 100000) * 25);
    
    -- 3. 이웃 수 점수 (0-25점)
    v_neighbor_score := LEAST(25, (p_neighbor_count / 500) * 25);
    
    -- 4. 참여도 점수 (0-25점)
    v_engagement_score := LEAST(25, ((p_avg_likes + p_avg_comments) / 20) * 25);
    
    -- 총점 계산
    v_score := v_daily_score + v_total_score + v_neighbor_score + v_engagement_score;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;
```

## 4. 테스트 데이터

```sql
-- 테스트 통계 데이터 추가
INSERT INTO influencer_stats (
    user_id,
    platform,
    blog_url,
    visitor_today,
    visitor_yesterday,
    visitor_total,
    neighbor_count,
    avg_likes,
    avg_comments,
    avg_engagement,
    main_categories,
    influence_score,
    last_crawled_at,
    crawl_status
)
SELECT 
    (SELECT id FROM profiles WHERE role = 'INFLUENCER' LIMIT 1),
    'NAVER_BLOG',
    'https://blog.naver.com/damgow',
    62,
    58,
    1104690,
    326,
    5.2,
    1.8,
    3.5,
    ARRAY['육아결혼이야기', '맛따라 길따라'],
    calculate_influence_score(62, 1104690, 326, 5.2, 1.8),
    NOW(),
    'SUCCESS'
ON CONFLICT (user_id, platform) DO UPDATE SET
    visitor_today = EXCLUDED.visitor_today,
    visitor_total = EXCLUDED.visitor_total,
    neighbor_count = EXCLUDED.neighbor_count,
    last_crawled_at = EXCLUDED.last_crawled_at;
```

## 5. 확인 쿼리

```sql
-- 인플루언서 통계 조회
SELECT 
    p.nickname,
    p.email,
    ist.*,
    calculate_influence_score(
        ist.visitor_today,
        ist.visitor_total,
        ist.neighbor_count,
        ist.avg_likes,
        ist.avg_comments
    ) as calculated_score
FROM influencer_stats ist
JOIN profiles p ON ist.user_id = p.id
ORDER BY ist.influence_score DESC;

-- 영향력 점수 상위 10명
SELECT 
    p.nickname,
    ist.influence_score,
    ist.visitor_today,
    ist.neighbor_count,
    ist.avg_engagement
FROM influencer_stats ist
JOIN profiles p ON ist.user_id = p.id
ORDER BY ist.influence_score DESC
LIMIT 10;
```

## 6. 일일 업데이트 로직

```sql
-- 어제 방문자 수 업데이트 (매일 자정 실행)
UPDATE influencer_stats
SET visitor_yesterday = visitor_today
WHERE last_crawled_at < CURRENT_DATE;
```
