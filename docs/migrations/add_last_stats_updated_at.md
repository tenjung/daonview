# DB Migration: Add last_stats_updated_at Column

## 목적
인플루언서 통계 자동 업데이트 시간을 추적하여 하루 1회 제한을 구현합니다.

## 실행할 SQL

Supabase SQL Editor에서 다음 쿼리를 실행하세요:

```sql
-- Add last_stats_updated_at column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_stats_updated_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN profiles.last_stats_updated_at IS 'Timestamp of the last automatic blog statistics update. Used to limit updates to once per 24 hours.';
```

## 설명

- **컬럼명**: `last_stats_updated_at`
- **타입**: `TIMESTAMPTZ` (타임존 포함 타임스탬프)
- **용도**: 마지막 블로그 통계 업데이트 시간 기록
- **제약**: 24시간 이내 재업데이트 방지

## 확인

컬럼이 추가되었는지 확인:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'last_stats_updated_at';
```
