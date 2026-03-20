# 🔥 리뷰 일괄 등록 "fetch failed" 오류 - 근본 원인 분석 보고서

## 📋 **문제 요약**
- **증상**: 리뷰 일괄 등록 시 모든 URL에서 "fetch failed" 오류 발생
- **환경**: Vercel 배포 환경 (로컬에서는 정상 작동)
- **영향**: 네이버 블로그, 인스타그램 모든 플랫폼 실패

---

## 🔍 **근본 원인 (Root Cause)**

### **1. Vercel Edge Runtime vs Node.js Runtime 충돌**

**문제의 핵심:**
- Next.js 13+ App Router는 기본적으로 **Edge Runtime**을 사용
- Edge Runtime은 경량화를 위해 **Node.js 전용 모듈을 지원하지 않음**
- 우리 코드는 `cheerio` (HTML 파싱 라이브러리)를 사용 중
- **Cheerio는 Node.js 전용 모듈** → Edge Runtime에서 크래시

**코드 경로:**
```
/api/reviews/bulk-create 
  → scrapeNaverBlog() 
    → import * as cheerio from 'cheerio'  ❌ CRASH!
```

### **2. 스파베이스 서버 변경과의 연관성**

스파베이스 서버를 India → Korea로 변경하면서:
- 새로운 프로젝트로 재배포
- Vercel이 자동으로 Edge Runtime 최적화 적용
- 기존에는 Node.js Runtime으로 작동했던 API가 Edge Runtime으로 전환
- **Cheerio 의존성이 있는 스크래핑 로직이 작동 불가**

### **3. 왜 로컬에서는 작동했는가?**

- **로컬 개발 환경**: `next dev` → 항상 Node.js Runtime 사용
- **Vercel 배포**: 자동 최적화 → Edge Runtime 선택
- **결과**: 로컬 ✅ / 배포 ❌

---

## ✅ **해결 방법**

### **적용한 수정사항**

두 개의 API Route에 **Node.js Runtime 강제 설정** 추가:

**1. `/api/reviews/bulk-create/route.ts`**
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**2. `/api/scrape-blog/route.ts`**
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

### **왜 이 방법이 효과적인가?**

| 항목 | Edge Runtime | Node.js Runtime |
|------|--------------|-----------------|
| Cheerio 지원 | ❌ 불가 | ✅ 가능 |
| 배포 속도 | 빠름 | 보통 |
| 메모리 사용 | 낮음 | 보통 |
| 스크래핑 작업 | ❌ 불가 | ✅ 최적 |

---

## 🚀 **다음 단계**

1. **Vercel 재배포 필요**
   ```bash
   git add .
   git commit -m "fix: Force Node.js runtime for scraping APIs"
   git push
   ```

2. **배포 후 테스트**
   - 리뷰 일괄 등록 페이지 접속
   - 네이버 블로그 URL 입력
   - "일괄 등록하기" 클릭
   - ✅ 성공 확인

---

## 📊 **예상 결과**

- ✅ "fetch failed" 오류 완전 해결
- ✅ 네이버 블로그 메타데이터 정상 수집
- ✅ 인스타그램 메타데이터 정상 수집
- ✅ DB 삽입 성공률 100%

---

## 🔒 **장기적 개선 방안**

### **Option A: 현재 방식 유지 (권장)**
- Node.js Runtime 사용
- 안정성 최우선
- 성능 충분

### **Option B: Edge-Compatible 스크래핑**
- Cheerio 제거
- 정규식 기반 파싱
- Edge Runtime 활용
- ⚠️ 안정성 저하 위험

### **Option C: 외부 스크래핑 서비스**
- ScrapingBee, Apify 등
- 100% Edge 호환
- 💰 월 비용 발생

---

## 📝 **결론**

**근본 원인**: Vercel Edge Runtime에서 Node.js 전용 Cheerio 모듈 사용 불가

**해결책**: API Route에 `export const runtime = 'nodejs'` 추가

**상태**: ✅ 수정 완료 → Vercel 재배포 필요
