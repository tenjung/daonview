# Campaign Platform Integrity Runbook

목표: `campaigns.platform` 값을 등록 정책(`BLOG | INSTAGRAM | PURCHASE`)으로 고정하고, `NAVER_BLOG` 레거시를 정규화한다.

## 1) 사전 점검 (읽기 전용)

```sql
-- 1. 현재 분포 확인
SELECT UPPER(COALESCE(platform, 'NULL')) AS platform_key, COUNT(*) AS cnt
FROM campaigns
GROUP BY 1
ORDER BY 2 DESC;

-- 2. 정책 외 값 확인
SELECT id, platform, type, created_at
FROM campaigns
WHERE UPPER(COALESCE(platform, '')) NOT IN ('BLOG', 'INSTAGRAM', 'PURCHASE')
ORDER BY created_at DESC
LIMIT 200;

-- 3. 플랫폼 NULL 확인
SELECT COUNT(*) AS null_count
FROM campaigns
WHERE platform IS NULL;
```

## 2) 적용 절차 (트랜잭션)

SQL 본문은 아래 문서 사용:
- [/Volumes/data/Dev/daonview/docs/migrations/campaign_platform_integrity.md](/Volumes/data/Dev/daonview/docs/migrations/campaign_platform_integrity.md)

운영 권장 순서:
1. 트래픽 저점 시간대에 실행
2. 사전 점검 쿼리 결과 저장
3. 트랜잭션 SQL 실행
4. 즉시 사후 검증

## 3) 사후 검증

```sql
-- 정책 외 값 0건 확인
SELECT COUNT(*) AS invalid_count
FROM campaigns
WHERE UPPER(COALESCE(platform, '')) NOT IN ('BLOG', 'INSTAGRAM', 'PURCHASE');

-- NAVER_BLOG 잔존 여부 확인
SELECT COUNT(*) AS naver_blog_count
FROM campaigns
WHERE UPPER(COALESCE(platform, '')) = 'NAVER_BLOG';

-- 최종 분포 재확인
SELECT UPPER(COALESCE(platform, 'NULL')) AS platform_key, COUNT(*) AS cnt
FROM campaigns
GROUP BY 1
ORDER BY 2 DESC;
```

## 4) 롤백 기준

- 제약 추가 직후 애플리케이션 오류 급증
- 예상치 못한 값이 대량으로 차단되어 등록/수정 실패 발생

롤백 SQL:

```sql
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_platform_check;
```

참고: 값 정규화(`NAVER_BLOG` -> `BLOG`)는 데이터 변경이므로, 필요 시 백업 테이블/시점 복구 정책에 따라 복원한다.

## 5) 애플리케이션 확인 체크리스트

1. 캠페인 등록 Step1에서 `DELIVERY/VISIT/PRESS` 플랫폼 선택 정상 동작
2. 캠페인 목록 카드/상세에서 플랫폼 뱃지 표시 이상 없음
3. 추천/리뷰 화면에서 `NAVER_BLOG`가 `BLOG`로 일관 노출
4. 관리자 캠페인 상태 배지 표시 정상
