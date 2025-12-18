## 🛑 [MUST READ] 코딩 어시스턴트 필수 준수 사항
1. 분석과 실행의 절대적 분리 (Zero Preemption Policy)

어떤 상황에서도 사용자의 명시적 실행 명령("해줘", "수정해줘", "진행해줘", "바꿔줘")이 없으면 파일 수정 도구(write_file, replace_file 등)를 절대 호출하지 않는다.
분석, 원인 파악, 제안 요청 시에는 오직 텍스트 기반의 답변만 제공한다. "수정할까요?"라고 먼저 묻는 것이 유일한 허용 행동이다.
2. 컨텍스트 우선순위

모든 대화 시작 시 최우선적으로 이 
README.md
를 로드하고, 모든 행동이 위 단계별 소통 원칙에 부합하는지 스스로 검열(Self-Correction)한 후 답변한다.
3. 위반 시 조치

분석 단계에서 동의 없이 코드를 수정하는 행위는 전체 프로젝트의 의사결정 구조를 해치는 심각한 오류로 간주한다.

4. 본 프로젝트는 DB 데이터를 초기 화면 로딩 시 즉시 렌더링하여 사용자 경험을 최적화하고, SEO(검색 엔진 최적화) 효율을 극대화하기 위해 Next.js 기반의 SSR(Server-Side Rendering) 방식을 전면 도입합니다.
## 모든 작업 내용은 한글로 설명해줘

## 💻 1. 기술 스택 및 환경 (Tech Stack)
- **Language:** TypeScript (tsx)
- **UI Component:** shadcn/ui
- **Icons:** Lucide React
- **Styling:** Tailwind CSS
- **Backend:** Supabase


## 🔄 2. 데이터베이스 및 타입 관리 (DB & Types)
- **타입 참조 파일:** `src/types/database.ts`
- **동기화 필수:** 데이터베이스에 CRUD 작업이 발생하거나 스키마가 변경될 경우, 반드시 다음 명령어를 실행하여 타입을 최신화한 후 진행한다.
  ```bash
  npm run update-types

무결성 체크: 프론트엔드 항목의 추가/제거 시 항상 DB와의 무결성을 확인하며, 필요 시 적용 가능한 SQL 쿼리를 함께 제공한다.


## 📝 3. 단계별 소통:
질문/제안 단계: 사용자가 질문하거나 의견을 물을 때는 코드를 수정하지 않고 상세한 답변과 원리 설명에 집중한다.

실행 단계: 사용자가 **"해줘", "실행해줘", "진행해줘", "바꿔줘"**와 같이 명시적인 명령을 내릴 때만 실제 코드 수정을 진행한다.

## 📝 4. 프론트엔드쪽에 항목이 추가되거나 제거될떄에는
항상 DB쪽과 무결성을 체크하여 문제되는 부분에 대한 SQL을 전달줘야 적용가능함

## 📝 5. 캠페인 카드 내의 뱃지데이터는 항상 바뀌어도 DB와 일치하게 만들어줘
메인페이지
캠페인 페이지 

## 📝 6. 데이터베이스 값 규칙 (Database Value Conventions)

### ⚠️ 필수 준수 사항
데이터베이스에 직접 데이터를 입력하거나 수정할 때는 반드시 아래 규칙을 따라야 합니다.
프론트엔드 코드는 이 값들을 기준으로 작성되어 있으며, 다른 값을 사용하면 UI가 깨지거나 데이터가 표시되지 않습니다.

### campaigns 테이블

#### platform (플랫폼) - 필수 값
**반드시 영문 대문자로 입력**
- `BLOG` - 네이버 블로그
- `INSTAGRAM` - 인스타그램 피드
- `REELS` - 인스타그램 릴스
- `YOUTUBE` - 유튜브 영상
- `SHORTS` - 유튜브 쇼츠
- `TIKTOK` - 틱톡
- `PURCHASE` - 구매 후기 (기타)

❌ 잘못된 예: `블로그`, `인스타그램`, `blog`, `Blog`
✅ 올바른 예: `BLOG`, `INSTAGRAM`

#### type (캠페인 유형) - 필수 값
**반드시 영문 대문자로 입력**
- `VISIT` - 방문형 캠페인
- `DELIVERY` - 배송형 캠페인
- `PURCHASE` - 구매형 캠페인
- `PRESS` - 기자단 캠페인

❌ 잘못된 예: `방문`, `방문형`, `visit`, `Visit`
✅ 올바른 예: `VISIT`, `DELIVERY`

#### status (캠페인 상태)
**반드시 영문 대문자로 입력**
- `PENDING` - 승인 대기
- `RECRUITING` - 모집 중
- `ONGOING` - 진행 중
- `COMPLETED` - 완료
- `REJECTED` - 거절됨

#### region (지역) - 선택 값
**한글로 입력 가능**
- 예: `서울`, `경기`, `부산`, `전국` 등

### profiles 테이블

#### role (사용자 역할)
**반드시 영문 대문자로 입력**
- `INFLUENCER` - 인플루언서 (기본값)
- `ADVERTISER` - 광고주
- `ADMIN` - 관리자

### applications 테이블

#### status (신청 상태)
**반드시 영문 대문자로 입력**
- `PENDING` - 심사 중
- `APPROVED` - 승인됨
- `REJECTED` - 거절됨
- `COMPLETED` - 완료

### 🔧 데이터 정리 SQL
기존 데이터가 규칙에 맞지 않을 경우 다음 SQL로 일괄 수정:

```sql
-- platform 통일
UPDATE campaigns SET platform = 'BLOG' WHERE platform IN ('블로그', 'blog', 'Blog');
UPDATE campaigns SET platform = 'INSTAGRAM' WHERE platform IN ('인스타그램', '인스타', 'instagram');
UPDATE campaigns SET platform = 'PURCHASE' WHERE platform IN ('구매평', '기타', 'purchase', 'OTHER');

-- type 통일
UPDATE campaigns SET type = 'VISIT' WHERE type IN ('방문', '방문형', 'visit');
UPDATE campaigns SET type = 'DELIVERY' WHERE type IN ('배송', '배송형', 'delivery');
UPDATE campaigns SET type = 'PURCHASE' WHERE type IN ('구매', '구매평', 'purchase');
```

### 📋 확인 쿼리
```sql
-- 현재 사용 중인 platform/type 값 확인
SELECT DISTINCT platform, type FROM campaigns;
```
