
# 🤖 AI 블로그 글쓰기 도우미 - 프로젝트 명세서

## 📋 프로젝트 개요
**목적**: 매장/제품 방문 경험을 SEO 최적화된 자연스러운 블로그 글로 자동 생성
**플랫폼**: 반응형 웹 애플리케이션 (모바일 우선)


-

### AI & API 연동

- **이미지 분석**: Google Cloud Vision API 또는 OpenAI Vision API
- **사실 검증**: Jina AI Grounding API (g.jina.ai) - 2단계 검증
- **매장 정보**: 네이버 플레이스 데이터 api연동
- **SEO 분석**: 네이버 데이터랩 api 연동

### 배포
- **호스팅**: Vercel 
- **데이터베이스** Supabase

---

## 🎯 핵심 기능 명세

### 1. UI 구조 및 입력 폼

#### 1.1 메인 화면 레이아웃
```
[헤더: 로고 + 앱 이름]
  |
  ├─ [Step 1] 매장/제품 정보 입력
  │   ├─ 매장명 입력 (required, autocomplete 지원)
  │   ├─ 먹은 음식/제품명 입력 (required)
  │   ├─ 간단 메모 (textarea, 500자 이내)
  │   └─ 이미지 업로드 (다중, 최대 10장, 순서 조정 가능)
  │
  ├─ [Step 2] AI 추천 카테고리 & 주제
  │   ├─ 카테고리 선택 (AI 추천 5개 + 직접 입력)
  │   ├─ 주제 선택 (AI 추천 3개 + 직접 수정)
  │   └─ SEO 키워드 미리보기 (롱테일 포함)
  │
  ├─ [Step 3] 글 생성 옵션
  │   ├─ 글 톤 선택 (친근함/전문적/유머러스/감성적)
  │   ├─ AI 느낌 제거 강도 (슬라이더 1-5)
  │   └─ 목표 글자 수 (1500~2500자)
  │
  └─ [생성 버튼] → 로딩 애니메이션
      ↓
  [결과 화면]
  ├─ 에디터 (수정 가능, WYSIWYG)
  ├─ SEO 점수 실시간 표시
  ├─ 개선 포인트 제안
  └─ 내보내기 옵션 (마크다운/HTML/티스토리/네이버)
```

#### 1.2 필수 입력 필드
- **매장명**: 
  - Google Places API 자동완성
  - 입력 시 매장 정보 미리보기 (주소, 영업시간, 대표메뉴)
- **음식/제품명**: 
  - 신제품 여부 자동 감지
  - 출시일 정보 수집
- **이미지**: 
  - 드래그앤드롭 업로드
  - 순서 재배치 가능
  - 각 이미지 자동 분석 (음식, 매장 외관, 메뉴판 등 구분)

---

### 2. SEO 최적화 시스템 ⭐

#### 2.1 카테고리 AI 추천 로직
**입력**: 매장명 + 음식/제품명 + 이미지 분석 결과
**처리**:
1. 구글 검색량 분석 (Keyword Planner API 또는 Semrush)
2. 롱테일 키워드 생성 (지역명 + 신상/인기 + 메인키워드)
3. 경쟁도 분석 (낮은 경쟁, 높은 검색량 우선)
**출력**: 
- 추천 카테고리 5개 (예: "부천 맛집", "신상 카페", "제품 리뷰")
- 각 카테고리별 검색량 표시
- 사용자 수정 가능 (editable dropdown)

#### 2.2 주제(제목) 생성
**AI 프롬프트 예시**:
```
당신은 SEO 전문가입니다. 
입력 정보:
- 매장명: {매장명}
- 카테고리: {선택된 카테고리}
- 키워드: {롱테일 키워드}

요구사항:
1. 클릭률 높은 제목 3개 생성
2. 각 제목은 50자 이내
3. 숫자, 질문형, 감성형 중 다양하게
4. 지역명 필수 포함
5. 신상/인기/추천 등 트렌드 단어 활용

출력 형식: JSON
{
  "titles": [
    {"title": "제목1", "seo_score": 85, "reason": "이유"},
    ...
  ]
}
```

---

### 3. 사실 검증 시스템 🔍 (최우선 제약사항)

#### 3.1 2단계 검증 프로세스

**[1차 검증] 정보 수집**
```javascript
// Google Places API로 매장 정보 수집
const placeDetails = await fetchPlaceDetails(매장명);
// 수집 항목:
// - 오픈일 (opening_date)
// - 영업시간 (opening_hours)
// - 주소 (formatted_address)
// - 전화번호 (formatted_phone_number)
// - 평점 (rating)
// - 리뷰 수 (user_ratings_total)
// - 대표 메뉴 (editorial_summary)
```

**[2차 검증] 교차 확인**
```javascript
// Jina AI Grounding API로 사실 검증
const verification = await verifyFacts({
  statements: [
    `${매장명}은 ${오픈일}에 오픈했다`,
    `${제품명}은 ${출시일}에 출시된 신제품이다`,
    `이 매장의 대표메뉴는 ${메뉴명}이다`
  ]
});

// 검증 결과 처리
if (verification.factuality < 0.7) {
  // 신뢰도 70% 미만 → 해당 정보 제외
  // 또는 "확인 필요" 표시
}
```

#### 3.2 허위 정보 방지 규칙
**절대 금지 사항**:
- ❌ 검증되지 않은 오픈일 기재
- ❌ 확인 안 된 신제품 정보
- ❌ 추측성 가격 정보
- ❌ 미확인 메뉴명

**안전한 대안 표현**:
- ✅ "최근 오픈한 것으로 보이는"
- ✅ "방문 당시 가격은 약"
- ✅ "메뉴판에서 확인한"

#### 3.3 검증 실패 시 처리
```javascript
if (verificationFailed) {
  // UI에 경고 표시
  showWarning("일부 정보를 확인할 수 없습니다. 해당 내용은 글에서 제외되었습니다.");

  // 로그 기록
  logUnverifiedInfo({
    statement: "검증 실패 문장",
    reason: "소스 2개 미만",
    timestamp: Date.now()
  });
}
```

---

### 4. 이미지 분석 및 활용 📸

#### 4.1 업로드 순서대로 분석
```javascript
// Google Cloud Vision API 사용
for (let i = 0; i < images.length; i++) {
  const analysis = await analyzeImage(images[i]);

  imageMetadata[i] = {
    type: detectImageType(analysis), // "외관", "메뉴", "음식", "메뉴판"
    description: analysis.labels,
    text: analysis.textDetections, // OCR (메뉴판 가격 추출)
    position: i // 글 내 삽입 위치 제안
  };
}
```

#### 4.2 글 작성 시 이미지 활용
**AI 프롬프트에 포함**:
```
이미지 정보:
1번 이미지: 매장 외관 (레이블: cafe, building, outdoor)
2번 이미지: 메뉴판 (텍스트: "아메리카노 4,500원", "라떼 5,000원")
3번 이미지: 음식 (레이블: coffee, latte art, dessert)

요구사항:
- 각 이미지 내용을 글에 자연스럽게 녹여서 설명
- 이미지 순서대로 스토리 전개
- 메뉴판에서 확인한 가격 정확히 기재
```

---

### 5. 글 생성 AI 프롬프트 설계 ✍️

#### 5.1 핵심 프롬프트 구조
```
[역할 설정]
당신은 10년 경력의 맛집 블로거입니다. 자연스럽고 친근한 글쓰기로 유명하며, AI가 아닌 사람이 쓴 것처럼 느껴지는 글을 작성합니다.

[제약 조건] ⚠️ 최우선 준수
1. 검증된 정보만 사용 (제공된 facts 객체 참조)
2. 절대 허위사실 작성 금지
3. 불확실한 정보는 추측 표현 사용

[입력 정보]
- 매장명: {매장명}
- 방문일: {방문일}
- 검증된 정보: {verifiedFacts}
- 이미지 분석 결과: {imageAnalysis}
- 사용자 메모: {userMemo}

[글 구조 - 기승전결]
1. 기(起): 독자의 호기심을 자극하는 도입부 (100자)
   - 질문형 또는 공감 유도
   - 예: "요즘 SNS에서 난리난 그 카페, 직접 가봤어요!"

2. 승(承): 매장 소개 및 분위기 (400자)
   - 위치, 접근성
   - 첫인상, 인테리어
   - 이미지1 활용 (매장 외관)

3. 전(轉): 메뉴 리뷰 및 핵심 경험 (800자)
   - 주문한 메뉴 상세 설명
   - 맛, 비주얼, 가격 평가
   - 이미지2-3 활용 (음식 사진)
   - 특별했던 점 강조

4. 결(結): 총평 및 추천 (200자)
   - 재방문 의사
   - 추천 대상 (데이트/혼밥/가족 등)
   - 팁 제공 (주차, 웨이팅 등)

[톤앤매너]
- 친근함 레벨: {toneLevel}/5
- 문장 길이: 짧고 다양하게 (10-30자 혼합)
- 이모지 사용: 문단당 0-1개
- 구어체 표현: 자연스럽게 ("정말", "진짜", "너무" 등)
- 형식적 표현 금지: "~에 대해 알아보겠습니다", "~라고 할 수 있습니다"

[AI 느낌 제거 규칙]
- ❌ 피해야 할 표현: "~에 대해", "~하는 것", "~라고 생각합니다"
- ✅ 선호 표현: "~했어요", "~더라고요", "~인 것 같아요"
- 문장 시작 다양화 (주어 변경, 시간 표현 활용)
- 리스트 형식 최소화 (자연스러운 서술)

[출력 형식]
- 총 1500-2000자
- 문단 구분: 3-4개
- 소제목: 사용하지 않음 (자연스러운 흐름 유지)
- SEO 키워드 자연스럽게 3회 이상 포함

[출력 JSON]
{
  "content": "생성된 본문",
  "seo_keywords_used": ["키워드1", "키워드2"],
  "image_positions": [
    {"imageIndex": 0, "afterParagraph": 1},
    {"imageIndex": 1, "afterParagraph": 2}
  ],
  "meta_description": "150자 요약"
}
```

#### 5.2 AI 톤 제거 후처리
```javascript
// 생성된 글 후처리 함수
function removeAIPatterns(text) {
  const patterns = [
    { regex: /에 대해 알아보겠습니다/g, replace: '에 대해 소개할게요' },
    { regex: /~라고 할 수 있습니다/g, replace: '~인 것 같아요' },
    { regex: /~하는 것이 중요합니다/g, replace: '~하면 좋아요' },
    // ... 더 추가
  ];

  let processed = text;
  patterns.forEach(p => {
    processed = processed.replace(p.regex, p.replace);
  });

  return processed;
}
```

---

### 6. SEO 점수 실시간 계산

#### 6.1 평가 항목
```javascript
const seoScore = {
  titleLength: checkRange(title.length, 30, 60), // 30-60자
  keywordDensity: checkRange(keywordCount / totalWords, 0.01, 0.03), // 1-3%
  headingStructure: hasH1 && hasH2, // 제목 구조
  metaDescription: checkRange(meta.length, 120, 160), // 120-160자
  imageAltText: allImagesHaveAlt, // 이미지 alt 텍스트
  internalLinks: linkCount >= 2, // 내부 링크 2개 이상
  readability: fleschScore > 60, // 가독성 점수
  mobileOptimized: true // 반응형
};

const totalScore = calculateWeightedAverage(seoScore);
```

#### 6.2 개선 제안 UI
```
[SEO 점수: 82/100] ⭐⭐⭐⭐☆

✅ 잘된 점:
- 키워드 밀도 적절 (2.3%)
- 제목 길이 최적 (42자)

⚠️ 개선 필요:
- 메타 설명이 너무 짧습니다 (98자 → 120자 권장)
- 이미지 3개에 alt 텍스트가 없습니다
```

---

### 7. 추가 제안 기능

#### 7.1 초안 자동 저장
- LocalStorage 또는 Supabase 활용
- 5초마다 자동 저장
- 최근 10개 초안 관리

#### 7.2 버전 비교
```
[버전1 - 오늘 14:20] [버전2 - 오늘 14:35]
├─ 변경 사항 하이라이트
├─ 복원 버튼
└─ 병합 옵션
```

#### 7.3 플랫폼별 최적화 내보내기
- **네이버 블로그**: 
  - 이미지 크기 조정 (최대 800px)
  - 스마트에디터 HTML 변환
- **티스토리**:
  - 마크다운 형식
  - 코드블록 지원
- **일반 HTML**:
  - 시맨틱 태그 사용
  - Schema.org 마크업 포함

---

## 🚀 구현 단계

### Phase 1: 기본 UI (1-2일)
- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] Tailwind CSS 설정
- [ ] 입력 폼 UI 구현
- [ ] 반응형 레이아웃

### Phase 2: API 연동 (2-3일)
- [ ] OpenAI API 연동
- [ ] Google Places API 연동
- [ ] Google Cloud Vision API 연동
- [ ] Jina AI Grounding API 연동

### Phase 3: 핵심 로직 (3-4일)
- [ ] SEO 키워드 추천 시스템
- [ ] 2단계 사실 검증 로직
- [ ] 이미지 분석 및 순서 처리
- [ ] 글 생성 프롬프트 최적화

### Phase 4: 후처리 및 고도화 (2-3일)
- [ ] AI 톤 제거 알고리즘
- [ ] SEO 점수 계산기
- [ ] 에디터 (Quill 또는 TipTap)
- [ ] 내보내기 기능

### Phase 5: 최적화 (1-2일)
- [ ] 로딩 상태 개선
- [ ] 에러 핸들링
- [ ] 초안 저장 기능
- [ ] 배포 (Vercel)

---

## ⚠️ 중요 제약사항 (반드시 준수)

### 1. 허위 정보 생성 절대 금지
- 모든 사실은 2개 이상 소스에서 검증
- 검증 실패 시 해당 정보 제외
- 추측성 정보는 명시적 표현 ("~인 것 같다")

### 2. 검증되지 않은 정보 명시
- UI에 "검증 안 됨" 뱃지 표시
- 사용자에게 수정 권장

### 3. 자연스러운 글쓰기
- AI 패턴 자동 제거
- 문장 다양성 확보
- 구어체 자연스럽게 활용

---

## 📦 필수 패키지

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "openai": "^4.20.0",
    "@google-cloud/vision": "^4.0.0",
    "quill": "^1.3.7" 또는 "@tiptap/react": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

## 🔑 환경 변수 (.env)

```env
VITE_OPENAI_API_KEY=sk-...
VITE_GOOGLE_PLACES_API_KEY=AIza...
VITE_GOOGLE_VISION_API_KEY=AIza...
VITE_JINA_AI_API_KEY=jina_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 📝 프로젝트 폴더 구조

```
src/
├── components/
│   ├── InputForm.tsx
│   ├── CategorySelector.tsx
│   ├── ImageUploader.tsx
│   ├── Editor.tsx
│   └── SEOScorePanel.tsx
├── services/
│   ├── openai.ts
│   ├── googlePlaces.ts
│   ├── googleVision.ts
│   ├── jinaGrounding.ts
│   └── seoAnalyzer.ts
├── hooks/
│   ├── useContentGeneration.ts
│   ├── useFactVerification.ts
│   └── useImageAnalysis.ts
├── utils/
│   ├── aiToneRemover.ts
│   ├── seoCalculator.ts
│   └── validators.ts
├── types/
│   └── index.ts
└── App.tsx
```

---

## 🎯 성공 지표

1. **사실 정확도**: 검증 통과율 95% 이상
2. **자연스러움**: AI 감지율 30% 이하
3. **SEO 점수**: 평균 80점 이상
4. **생성 속도**: 30초 이내
5. **사용자 만족도**: 수정 없이 바로 발행 60% 이상

---

## 💡 개발 팁

1. **API 호출 최적화**: 
   - Promise.all로 병렬 처리
   - 결과 캐싱 (React Query)

2. **에러 핸들링**:
   - API 실패 시 폴백 UI
   - 재시도 로직 구현

3. **성능 최적화**:
   - 이미지 lazy loading
   - 에디터 debounce 처리
   - 코드 스플리팅

4. **보안**:
   - API 키는 서버리스 함수로 프록시
   - 사용자 입력 sanitization

---

이 명세서를 Claude, ChatGPT, 또는 Cursor AI 등의 코딩 도구에 입력하면
바로 구현을 시작할 수 있습니다.
