# 🚀 Supabase SQL 적용 가이드

## 📋 현재 상황
- ✅ `profiles` 테이블: 존재함
- ✅ `campaigns` 테이블: 존재함  
- ✅ `applications` 테이블: 존재함
- ❌ `favorites` 테이블: **생성 필요**

---

## 🎯 적용할 내용

### 1. **Favorites 테이블 생성** (신규)
- 관심 캠페인 저장 기능
- 중복 방지 제약 조건
- RLS 보안 정책

### 2. **Applications 테이블 RLS 정책 추가**
- 사용자별 접근 제어
- 관리자 권한 설정

### 3. **Profiles 테이블 컬럼 추가** (선택)
- `phone_number`: 전화번호
- `sns_url`: SNS URL

### 4. **인덱스 추가**
- 쿼리 성능 최적화

---

## 🔧 실행 방법

### **Step 1: Supabase Dashboard 접속**
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### **Step 2: SQL 실행**
1. **New Query** 버튼 클릭
2. `supabase_final.sql` 파일 내용 **전체 복사**
3. SQL Editor에 **붙여넣기**
4. **Run** 버튼 클릭 (또는 Ctrl+Enter)

### **Step 3: 결과 확인**
성공 메시지가 나타나면 완료!

```
Success. No rows returned
```

---

## ✅ 확인 방법

SQL 실행 후 아래 쿼리로 확인하세요:

### 1. Favorites 테이블 생성 확인
```sql
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'favorites'
ORDER BY ordinal_position;
```

**예상 결과:**
```
id              | bigint
user_id         | uuid
campaign_id     | bigint
created_at      | timestamptz
```

### 2. RLS 정책 확인
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('favorites', 'applications');
```

**예상 결과:**
- favorites: 3개 정책 (view, insert, delete)
- applications: 5개 정책 (view, insert, update, admin view, admin update)

### 3. 인덱스 확인
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('favorites', 'applications')
AND schemaname = 'public';
```

---

## ⚠️ 주의사항

### 안전한 실행
- ✅ `CREATE TABLE IF NOT EXISTS` 사용 → 이미 있으면 스킵
- ✅ `DROP POLICY IF EXISTS` 사용 → 중복 방지
- ✅ `DO $$ BEGIN ... END $$` 사용 → 컬럼 중복 방지

### 롤백이 필요한 경우
```sql
-- Favorites 테이블 삭제 (필요시)
DROP TABLE IF EXISTS favorites CASCADE;

-- Applications RLS 정책 삭제 (필요시)
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
```

---

## 🐛 문제 해결

### 오류 1: "permission denied for schema public"
**해결:** Supabase 프로젝트 소유자 계정으로 로그인했는지 확인

### 오류 2: "relation campaigns does not exist"
**해결:** campaigns 테이블이 없습니다. 먼저 campaigns 테이블을 생성하세요.

### 오류 3: "duplicate key value violates unique constraint"
**해결:** 정상입니다. 이미 데이터가 있는 경우 발생할 수 있습니다.

---

## 📊 실행 후 테스트

### 테스트 1: Favorites 기능
```sql
-- 현재 로그인한 사용자로 테스트
INSERT INTO favorites (user_id, campaign_id)
VALUES (auth.uid(), 1);

-- 조회
SELECT * FROM favorites WHERE user_id = auth.uid();

-- 삭제
DELETE FROM favorites WHERE user_id = auth.uid() AND campaign_id = 1;
```

### 테스트 2: Applications 기능
```sql
-- 신청 추가
INSERT INTO applications (user_id, campaign_id, status)
VALUES (auth.uid(), 1, 'pending');

-- 조회
SELECT * FROM applications WHERE user_id = auth.uid();
```

---

## ✨ 완료 후 확인사항

웹 애플리케이션에서 다음 기능들이 작동하는지 확인:

- [ ] 캠페인 상세 페이지에서 하트 버튼 클릭 (관심 캠페인 추가)
- [ ] 관심 캠페인 페이지에서 목록 확인
- [ ] 캠페인 신청 버튼 클릭
- [ ] 나의 캠페인 페이지에서 신청 내역 확인
- [ ] 인플루언서 대시보드에서 통계 확인

---

## 🎉 완료!

모든 SQL이 성공적으로 실행되었다면:
1. 브라우저에서 애플리케이션 새로고침 (Ctrl+F5)
2. 로그인 후 기능 테스트
3. 문제 발생 시 브라우저 콘솔(F12) 확인

**문제가 있다면 에러 메시지를 공유해주세요!**
