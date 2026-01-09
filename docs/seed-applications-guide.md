# 테스트 신청자 데이터 추가 가이드

신청자 관리 페이지를 테스트하기 위해 Supabase SQL Editor에서 아래 SQL을 실행하세요.

## 1. 진행 중인 캠페인 확인

```sql
SELECT id, title, status, recruit_count 
FROM campaigns 
WHERE status IN ('RECRUITING', 'ONGOING')
ORDER BY created_at DESC
LIMIT 5;
```

## 2. 인플루언서 사용자 확인

```sql
SELECT id, nickname, email 
FROM profiles 
WHERE role = 'INFLUENCER'
LIMIT 10;
```

## 3. 테스트 신청자 데이터 추가

아래 SQL에서 `v_campaign_id` 값을 실제 캠페인 ID로 변경한 후 실행하세요.

```sql
DO $$
DECLARE
    v_campaign_id INTEGER := 39; -- 실제 캠페인 ID로 변경
    v_influencer_ids UUID[];
    v_user_id UUID;
    v_status TEXT;
    v_message TEXT;
    v_counter INTEGER := 0;
BEGIN
    -- 인플루언서 ID 목록 가져오기
    SELECT ARRAY_AGG(id) INTO v_influencer_ids
    FROM (
        SELECT id FROM profiles 
        WHERE role = 'INFLUENCER' 
        LIMIT 5
    ) sub;

    -- 각 인플루언서에 대해 신청 추가
    FOREACH v_user_id IN ARRAY v_influencer_ids
    LOOP
        v_counter := v_counter + 1;
        
        -- 상태 순환 (PENDING, APPROVED, REJECTED)
        v_status := CASE 
            WHEN v_counter % 3 = 1 THEN 'PENDING'
            WHEN v_counter % 3 = 2 THEN 'APPROVED'
            ELSE 'REJECTED'
        END;
        
        -- 메시지 순환
        v_message := CASE 
            WHEN v_counter % 5 = 1 THEN '안녕하세요! 이 캠페인에 참여하고 싶습니다. 제 SNS를 통해 좋은 리뷰를 작성하겠습니다.'
            WHEN v_counter % 5 = 2 THEN '평소 이런 제품에 관심이 많았습니다. 성실하게 리뷰하겠습니다!'
            WHEN v_counter % 5 = 3 THEN '팔로워 수는 많지 않지만 진정성 있는 콘텐츠로 승부하겠습니다.'
            WHEN v_counter % 5 = 4 THEN '이전에도 여러 캠페인에 참여한 경험이 있습니다. 믿고 맡겨주세요!'
            ELSE '제 블로그/인스타그램을 통해 많은 분들께 알려드리겠습니다.'
        END;
        
        -- 중복 체크 후 삽입
        INSERT INTO applications (campaign_id, user_id, status, message, created_at)
        SELECT 
            v_campaign_id,
            v_user_id,
            v_status,
            v_message,
            NOW() - (v_counter || ' hours')::INTERVAL
        WHERE NOT EXISTS (
            SELECT 1 FROM applications 
            WHERE campaign_id = v_campaign_id AND user_id = v_user_id
        );
    END LOOP;
    
    RAISE NOTICE 'Successfully added % applications', v_counter;
END $$;
```

## 4. 결과 확인

```sql
SELECT 
    a.id,
    a.status,
    a.created_at,
    p.nickname,
    p.email,
    LEFT(a.message, 50) || '...' as message_preview
FROM applications a
JOIN profiles p ON a.user_id = p.id
WHERE a.campaign_id = 39  -- 실제 캠페인 ID로 변경
ORDER BY a.created_at DESC;
```

## 5. 통계 확인

```sql
SELECT 
    c.id,
    c.title,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'PENDING' THEN 1 END) as pending,
    COUNT(CASE WHEN a.status = 'APPROVED' THEN 1 END) as approved,
    COUNT(CASE WHEN a.status = 'REJECTED' THEN 1 END) as rejected
FROM campaigns c
LEFT JOIN applications a ON c.id = a.campaign_id
WHERE c.id = 39  -- 실제 캠페인 ID로 변경
GROUP BY c.id, c.title;
```

## 6. 페이지 접속

신청자 관리 페이지 URL: `http://localhost:3000/dashboard/admin/campaigns/[캠페인ID]`

예시: `http://localhost:3000/dashboard/admin/campaigns/39`
