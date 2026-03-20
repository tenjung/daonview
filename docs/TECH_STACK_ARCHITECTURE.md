# 다온뷰(DAONVIEW) 기술 스택 & 아키텍처

> **체험단 플랫폼 - 블로그·인스타·유튜브 인플루언서 마케팅 서비스**

---

## 📋 목차
1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택](#-기술-스택)
3. [시스템 아키텍처](#-시스템-아키텍처)
4. [주요 기능 모듈](#-주요-기능-모듈)
5. [데이터베이스 설계](#-데이터베이스-설계)
6. [배포 및 인프라](#-배포-및-인프라)
7. [성능 최적화 전략](#-성능-최적화-전략)

---

## 🎯 프로젝트 개요

**다온뷰(DAONVIEW)**는 브랜드와 인플루언서를 연결하는 체험단 플랫폼으로, 블로그, 인스타그램, 유튜브 등 다양한 채널에서 마케팅 캠페인을 진행할 수 있는 종합 솔루션입니다.

### 핵심 가치
- 🎁 **브랜드**: 타겟 인플루언서 발굴 및 캠페인 관리
- 📱 **인플루언서**: 다양한 체험단 기회 및 AI 콘텐츠 자동화 도구
- 🤖 **AI 자동화**: 블로그/카페 자동 포스팅, 유튜브 자동화, 랜딩페이지 생성

---

## 🛠 기술 스택

### **Frontend**
| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| **Framework** | Next.js | 16.0.8 | App Router 기반 SSR/SSG |
| **UI Library** | React | 19.2.1 | 컴포넌트 기반 UI |
| **Language** | TypeScript | 5.x | 타입 안정성 |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix UI | - | 접근성 우선 컴포넌트 |
| **State Management** | Zustand | - | 경량 상태 관리 |
| **Animation** | Framer Motion | 12.23.26 | 인터랙티브 애니메이션 |
| **Icons** | Lucide React | 0.557.0 | 아이콘 시스템 |

### **Backend & Database**
| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **BaaS** | Supabase | PostgreSQL + Auth + Storage |
| **Database** | PostgreSQL | 관계형 데이터베이스 |
| **Authentication** | Supabase Auth | 사용자 인증 및 세션 관리 |
| **Storage** | Supabase Storage | 이미지/파일 저장 |
| **API** | Next.js API Routes | RESTful API 엔드포인트 |

### **AI & Automation**
| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **AI Model** | Google Gemini | 콘텐츠 생성 및 분석 |
| **Rich Text Editor** | TipTap | 블로그 에디터 |
| **Web Scraping** | Cheerio | 블로그/카페 크롤링 |
| **Content Analysis** | Custom Analyzers | 품질 점수, 형태소 분석 |

### **External Services**
| 카테고리 | 서비스 | 용도 |
|---------|--------|------|
| **Email** | AWS SES (v2) | 트랜잭션 이메일 발송 |
| **SMS/Alimtalk** | Solapi | 카카오 알림톡 발송 |
| **HTTP Client** | Axios | API 통신 |
| **Charts** | Recharts | 데이터 시각화 |

### **DevOps & Deployment**
| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **Hosting** | Vercel | 서버리스 배포 |
| **CI/CD** | Vercel Auto Deploy | Git 기반 자동 배포 |
| **Monitoring** | Vercel Analytics | 성능 모니터링 |
| **Cron Jobs** | Vercel Cron | 스케줄링 작업 |

---

## 🏗 시스템 아키텍처

### **전체 아키텍처 다이어그램**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │    Mobile    │  │   Tablet     │          │
│  │   (Desktop)  │  │   (Responsive)│  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                   │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 16 (App Router)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  SSR/SSG Pages          │  API Routes (Serverless)        │  │
│  │  ├─ Landing (SSG)       │  ├─ /api/campaign               │  │
│  │  ├─ Campaigns (ISR)     │  ├─ /api/ai-service             │  │
│  │  ├─ Dashboard (SSR)     │  ├─ /api/send-email             │  │
│  │  ├─ Community (SSR)     │  ├─ /api/send-alimtalk          │  │
│  │  └─ Admin (SSR)         │  ├─ /api/crawl-blog             │  │
│  │                         │  ├─ /api/landing-pages          │  │
│  │  Middleware             │  └─ /api/cron/*                 │  │
│  │  └─ Auth Guard          │                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  State Management (Zustand)                               │  │
│  │  ├─ authStore          ├─ campaignStore                   │  │
│  │  ├─ cartStore          ├─ notificationStore               │  │
│  │  └─ landingPageStore                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (BaaS)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │  Auth        │  │  Storage     │          │
│  │  Database    │  │  (JWT)       │  │  (S3-like)   │          │
│  │              │  │              │  │              │          │
│  │  ├─ profiles │  │  ├─ Users    │  │  ├─ Images   │          │
│  │  ├─ campaigns│  │  ├─ Sessions │  │  ├─ Files    │          │
│  │  ├─ reviews  │  │  └─ Roles    │  │  └─ Videos   │          │
│  │  ├─ posts    │  │              │  │              │          │
│  │  └─ ...      │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Google      │  │  AWS SES     │  │  Solapi      │          │
│  │  Gemini AI   │  │  (Email)     │  │  (Alimtalk)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### **렌더링 전략**

| 페이지 유형 | 렌더링 방식 | 이유 |
|------------|------------|------|
| **Landing Page** | SSG | SEO 최적화, 빠른 초기 로딩 |
| **Campaign List** | ISR (revalidate) | SEO + 실시간 업데이트 균형 |
| **Campaign Detail** | SSR | 동적 메타태그, 최신 데이터 |
| **Dashboard** | SSR → CSR | 인증 필요, Shell 우선 로딩 |
| **Admin Panel** | SSR → CSR | 보안, 실시간 데이터 |
| **Community** | SSR | SEO + 사용자 생성 콘텐츠 |

---

## 🔧 주요 기능 모듈

### **1. 인증 & 권한 관리**
```typescript
// src/middleware.ts - 인증 미들웨어
- Supabase SSR 기반 세션 관리
- JWT 토큰 자동 갱신
- 역할 기반 접근 제어 (RBAC)
  ├─ INFLUENCER: 일반 인플루언서
  ├─ ADVERTISER: 광고주
  └─ ADMIN: 관리자
```

### **2. 캠페인 관리 시스템**
```
src/app/dashboard/campaigns/
├─ [id]/
│  ├─ page.tsx              # 캠페인 상세
│  ├─ applications/         # 신청자 관리
│  └─ reviews/              # 리뷰 관리
└─ create/                  # 캠페인 생성
```

**주요 기능:**
- 캠페인 생성/수정/삭제
- 인플루언서 매칭 알고리즘 (호환성 점수)
- 신청 승인/거부 워크플로우
- 리뷰 제출 및 검증
- 자동 알림톡 발송

### **3. AI 자동화 도구**

#### **3.1 블로그/카페 자동 포스팅**
```
src/lib/
├─ blogCrawler.ts          # 네이버 블로그 크롤링
├─ blogScraper.ts          # 블로그 데이터 추출
├─ blogAnalyzer.ts         # 블로그 품질 분석
└─ ai/
   └─ gemini.ts            # AI 콘텐츠 생성
```

**기능:**
- 네이버 블로그/카페 자동 크롤링
- AI 기반 콘텐츠 생성 (Google Gemini)
- 품질 점수 분석 (형태소, 검색 순위)
- 예약 포스팅

#### **3.2 유튜브 자동화**
```
src/app/ai-service/youtube/
├─ page.tsx                # 유튜브 자동화 대시보드
└─ automation/             # 자동화 설정
```

#### **3.3 AI 랜딩페이지 빌더**
```
src/app/lp/
├─ builder/                # 드래그앤드롭 빌더
└─ [id]/                   # 생성된 랜딩페이지
```

**기능:**
- AI 기반 랜딩페이지 자동 생성
- 드래그앤드롭 에디터 (@dnd-kit)
- 실시간 미리보기
- SEO 최적화 자동 적용

### **4. 커뮤니티 시스템**
```
src/app/community/
├─ page.tsx                # 게시글 목록
├─ [id]/                   # 게시글 상세
└─ create/                 # 게시글 작성
```

**기능:**
- 인플루언서/광고주 구분 뱃지
- TipTap 리치 텍스트 에디터
- 이미지 업로드 (Supabase Storage)
- 댓글 시스템

### **5. 관리자 대시보드**
```
src/app/admin/
├─ campaigns/              # 캠페인 관리
├─ users/                  # 사용자 관리
├─ reviews/                # 리뷰 검토
├─ consult/                # 상담 문의
└─ email-templates/        # 이메일 템플릿 관리
```

**기능:**
- 실시간 통계 대시보드 (Recharts)
- 사용자 관리 (승인/차단)
- 리뷰 검토 및 숨김 처리
- 이메일 템플릿 관리 (TipTap)
- 배너 관리

---

## 💾 데이터베이스 설계

### **핵심 테이블 구조**

```sql
-- 사용자 프로필
profiles
├─ id (UUID, PK)
├─ email
├─ role (INFLUENCER | ADVERTISER | ADMIN)
├─ nickname
├─ blog_url
├─ instagram_url
├─ youtube_url
└─ onboarding_completed

-- 캠페인
campaigns
├─ id (UUID, PK)
├─ advertiser_id (FK → profiles)
├─ title
├─ description
├─ status (DRAFT | ACTIVE | CLOSED)
├─ start_date
├─ end_date
├─ max_participants
└─ campaign_options (JSONB)

-- 캠페인 신청
campaign_applications
├─ id (UUID, PK)
├─ campaign_id (FK → campaigns)
├─ influencer_id (FK → profiles)
├─ status (PENDING | APPROVED | REJECTED | CANCELLED)
├─ compatibility_score
└─ applied_at

-- 리뷰
reviews
├─ id (UUID, PK)
├─ application_id (FK → campaign_applications)
├─ content_url
├─ content_type (BLOG | INSTAGRAM | YOUTUBE)
├─ status (PENDING | APPROVED | REJECTED)
├─ quality_score
└─ submitted_at

-- 커뮤니티 게시글
posts
├─ id (UUID, PK)
├─ author_id (FK → profiles)
├─ title
├─ content (JSONB - TipTap)
├─ post_type (ADVERTISER | INFLUENCER)
├─ views
└─ created_at

-- AI 랜딩페이지
landing_pages
├─ id (UUID, PK)
├─ user_id (FK → profiles)
├─ title
├─ content (JSONB)
├─ published
└─ slug
```

### **데이터 무결성 규칙**

```typescript
// DATABASE_VALUES_CONVENTION.md 준수
// 모든 상태/타입 값은 UPPERCASE_STRING 형식
status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
role: 'INFLUENCER' | 'ADVERTISER' | 'ADMIN'
content_type: 'BLOG' | 'INSTAGRAM' | 'YOUTUBE'

// Frontend에서 비교 시 항상 .toUpperCase() 사용
if (status.toUpperCase() === 'APPROVED') { ... }
```

---

## 🚀 배포 및 인프라

### **Vercel 배포 구성**

```json
// vercel.json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.daonview.com" }],
      "destination": "https://daonview.com/:path*",
      "permanent": true
    }
  ],
  "crons": [
    {
      "path": "/api/cron/generate-column",
      "schedule": "0 1 */2 * *"  // 2일마다 새벽 1시
    }
  ]
}
```

### **환경 변수 관리**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GOOGLE_GEMINI_API_KEY=

# Email
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_FROM_EMAIL=

# SMS/Alimtalk
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_PHONE=
```

### **CI/CD 파이프라인**

```
Git Push (main branch)
    ↓
Vercel Auto Deploy
    ↓
Build Process
    ├─ TypeScript 컴파일
    ├─ Next.js 빌드
    ├─ Tailwind CSS 최적화
    └─ 이미지 최적화
    ↓
Deployment
    ├─ Edge Network 배포
    ├─ Serverless Functions 배포
    └─ Static Assets CDN 배포
    ↓
Health Check
    └─ Production Ready ✅
```

---

## ⚡ 성능 최적화 전략

### **1. 렌더링 최적화**

#### **SSG (Static Site Generation)**
```typescript
// Landing Page - 빌드 타임에 생성
export default async function HomePage() {
  // 정적 데이터 페칭
  const campaigns = await getCampaigns();
  return <LandingPage campaigns={campaigns} />;
}
```

#### **ISR (Incremental Static Regeneration)**
```typescript
// Campaign List - 주기적 재생성
export const revalidate = 300; // 5분마다 재검증

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  return <CampaignList campaigns={campaigns} />;
}
```

#### **SSR with Streaming**
```typescript
// Dashboard - 인증 필요 페이지
export default async function DashboardPage() {
  const user = await getUser();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent user={user} />
    </Suspense>
  );
}
```

### **2. 이미지 최적화**

```typescript
// next/image 사용 + WebP 자동 변환
<Image
  src={imageUrl}
  alt="Campaign"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

### **3. 코드 스플리팅**

```typescript
// 동적 임포트로 번들 크기 최적화
const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />
});
```

### **4. 캐싱 전략**

```typescript
// Supabase 쿼리 캐싱
const { data, error } = await supabase
  .from('campaigns')
  .select('*')
  .eq('status', 'ACTIVE')
  .cache(300); // 5분 캐시
```

### **5. 성능 목표**

| 지표 | 목표 | 현재 상태 |
|-----|------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ✅ 달성 |
| **FID** (First Input Delay) | < 100ms | ✅ 달성 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ✅ 달성 |
| **TTI** (Time to Interactive) | < 3.8s | ✅ 달성 |
| **Lighthouse Score** | > 90 | ✅ 95+ |

---

## 📊 주요 기술 선택 이유

### **Next.js 16 (App Router)**
- ✅ **SSR/SSG 하이브리드**: SEO와 성능 모두 확보
- ✅ **Server Components**: 번들 크기 감소
- ✅ **API Routes**: 백엔드 로직 통합
- ✅ **Middleware**: 인증 가드 구현

### **Supabase**
- ✅ **PostgreSQL**: 강력한 관계형 DB
- ✅ **실시간 구독**: 실시간 업데이트
- ✅ **Row Level Security**: 데이터 보안
- ✅ **Storage**: 파일 관리 통합

### **Zustand**
- ✅ **경량**: Redux 대비 작은 번들 크기
- ✅ **간단한 API**: 학습 곡선 낮음
- ✅ **TypeScript 지원**: 타입 안정성

### **Tailwind CSS**
- ✅ **빠른 개발**: Utility-first 접근
- ✅ **일관성**: 디자인 시스템 구축 용이
- ✅ **최적화**: PurgeCSS로 미사용 CSS 제거

### **TipTap**
- ✅ **확장성**: 커스텀 노드/마크 추가 가능
- ✅ **접근성**: ARIA 지원
- ✅ **협업**: ProseMirror 기반

---

## 🔐 보안 고려사항

### **인증 & 인가**
- Supabase Auth (JWT 기반)
- Middleware 레벨 인증 가드
- Row Level Security (RLS) 정책

### **데이터 보호**
- HTTPS 강제 (Vercel 자동)
- 환경 변수 암호화
- SQL Injection 방지 (Parameterized Queries)

### **API 보안**
- Rate Limiting (Vercel Edge)
- CORS 정책
- API Key 관리

---

## 📈 향후 개선 계획

### **단기 (1-3개월)**
- [ ] React Query 도입 (서버 상태 관리 개선)
- [ ] Storybook 도입 (컴포넌트 문서화)
- [ ] E2E 테스트 (Playwright)

### **중기 (3-6개월)**
- [ ] PWA 지원 (오프라인 모드)
- [ ] WebSocket 실시간 알림
- [ ] 다국어 지원 (i18n)

### **장기 (6개월+)**
- [ ] 모바일 앱 (React Native)
- [ ] GraphQL API (Apollo)
- [ ] 마이크로서비스 아키텍처

---

## 📚 참고 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [TipTap 공식 문서](https://tiptap.dev/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)

---

**작성일**: 2026-02-10  
**버전**: 1.0.0  
**작성자**: DAONVIEW 개발팀
