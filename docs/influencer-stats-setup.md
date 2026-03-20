# 인플루언서 통계 시스템 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일에 다음 변수를 추가하세요:

```env
# Supabase Service Role Key (RLS 우회용)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Service Role Key 찾기

1. Supabase 대시보드 접속
2. 프로젝트 선택
3. Settings → API 메뉴
4. **Project API keys** 섹션에서 `service_role` 키 복사
5. `.env.local`에 붙여넣기

⚠️ **주의**: Service Role Key는 절대 클라이언트 코드에 노출하면 안 됩니다!

---

## 2. DB 마이그레이션 실행

`docs/migrations/create_influencer_stats.md` 파일의 SQL을 Supabase SQL Editor에서 실행하세요.

### 실행 순서

1. **테이블 생성**
2. **인덱스 생성**
3. **트리거 생성**
4. **RLS 정책 설정**
5. **영향력 점수 계산 함수 생성**

---

## 3. 사용 방법

### A. 자동 크롤링

신청자 관리 페이지에서 각 인플루언서의 "블로그 통계" 카드에 있는 새로고침 버튼을 클릭하면 자동으로 크롤링이 실행됩니다.

### B. 수동 API 호출

```typescript
// 블로그 크롤링 실행
const response = await fetch('/api/crawl-blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        userId: 'user-uuid',
        blogUrl: 'https://blog.naver.com/blogid'
    })
});

const result = await response.json();
console.log(result.data.stats);
```

### C. 통계 조회

```typescript
// 저장된 통계 조회
const response = await fetch(`/api/crawl-blog?userId=${userId}`);
const { data } = await response.json();
console.log(data);
```

---

## 4. 크롤링 데이터 구조

### 수집되는 데이터

```typescript
{
    visitor_today: number,        // 오늘 방문자
    visitor_yesterday: number,    // 어제 방문자 (전날 today 값)
    visitor_total: number,        // 전체 방문자
    neighbor_count: number,       // 이웃 수
    avg_likes: number,            // 평균 좋아요
    avg_comments: number,         // 평균 댓글
    avg_engagement: number,       // 평균 참여도
    main_categories: string[],    // 주요 카테고리
    influence_score: number       // 영향력 점수 (0-100)
}
```

### 영향력 점수 산정 기준

| 항목 | 배점 | 기준 |
|------|------|------|
| 일 방문자 | 0-25점 | 100명당 25점 |
| 전체 방문자 | 0-25점 | 10만명당 25점 |
| 이웃 수 | 0-25점 | 500명당 25점 |
| 참여도 | 0-25점 | (좋아요+댓글) 20개당 25점 |

**총점**: 0-100점

**등급**:
- S급: 80점 이상
- A급: 60-79점
- B급: 40-59점
- C급: 20-39점
- D급: 20점 미만

---

## 5. 캐싱 및 성능

### 크롤링 주기

- 기본: 24시간마다 1회
- 수동 새로고침: 언제든지 가능
- 자동 업데이트: 매일 자정 `visitor_yesterday` 업데이트

### 성능 최적화

1. **병렬 처리**: 여러 인플루언서 동시 크롤링
2. **타임아웃**: 각 요청 10초 제한
3. **에러 핸들링**: 실패 시 DB에 에러 상태 기록

---

## 6. 문제 해결

### 크롤링 실패 시

1. **블로그 URL 확인**: 네이버 블로그 형식인지 확인
2. **네트워크 확인**: 서버에서 네이버 접근 가능한지 확인
3. **로그 확인**: 서버 콘솔에서 에러 메시지 확인

### DB 오류 시

```sql
-- 통계 테이블 확인
SELECT * FROM influencer_stats WHERE crawl_status = 'FAILED';

-- 에러 내용 확인
SELECT user_id, crawl_error, last_crawled_at 
FROM influencer_stats 
WHERE crawl_status = 'FAILED'
ORDER BY last_crawled_at DESC;
```

---

## 7. 일일 배치 작업 (선택사항)

어제 방문자 수를 자동으로 업데이트하려면 Supabase Edge Function 또는 Cron Job을 설정하세요.

```sql
-- 매일 자정 실행
UPDATE influencer_stats
SET visitor_yesterday = visitor_today
WHERE last_crawled_at < CURRENT_DATE;
```

---

## 8. 보안 주의사항

1. ✅ Service Role Key는 서버 사이드에서만 사용
2. ✅ 클라이언트에서는 일반 Anon Key 사용
3. ✅ RLS 정책으로 데이터 접근 제어
4. ✅ 크롤링 API는 인증된 사용자만 호출 가능하도록 설정

---

완료! 🎉
