# Campaign Platform Integrity Migration

`campaigns.platform`을 등록 정책 값(`BLOG | INSTAGRAM | PURCHASE`)으로 고정하기 위한 제안 SQL입니다.

```sql
BEGIN;

UPDATE campaigns
SET platform = 'BLOG'
WHERE UPPER(COALESCE(platform, '')) = 'NAVER_BLOG';

UPDATE campaigns
SET platform = UPPER(platform)
WHERE platform IS NOT NULL
  AND platform <> UPPER(platform);

-- Optional pre-check
-- SELECT id, platform
-- FROM campaigns
-- WHERE UPPER(COALESCE(platform, '')) NOT IN ('BLOG', 'INSTAGRAM', 'PURCHASE');

ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_platform_check;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_platform_check
  CHECK (UPPER(COALESCE(platform, '')) IN ('BLOG', 'INSTAGRAM', 'PURCHASE'));

COMMIT;
```
