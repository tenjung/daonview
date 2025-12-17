# 임시저장 기능 구현 완료

## 📋 구현 내용

### 1. 임시저장 유틸리티 (`src/lib/draftUtils.ts`)
- ✅ localStorage 기반 임시저장 관리
- ✅ 사용자별 최대 10개 제한
- ✅ 자동 정렬 (최신순)
- ✅ CRUD 기능 (생성, 조회, 삭제)

### 2. 캠페인 불러오기 컴포넌트 (`src/components/campaign/CampaignLoader.tsx`)
- ✅ 임시저장 캠페인 탭
- ✅ 이전 요청완료 캠페인 탭
- ✅ 작성하러 가기 / 삭제 기능
- ✅ 최대 10개 저장 툴팁

### 3. 임시저장 페이지 (`src/app/dashboard/campaign/drafts/page.tsx`)
- ✅ 카드 형식 목록 표시
- ✅ 진행 상태 표시 (Step 1/3)
- ✅ 작성하러 가기 버튼
- ✅ 삭제 기능

### 4. 신규 캠페인 페이지 통합 (`src/app/dashboard/campaign/new/page.tsx`)
- ✅ CampaignLoader 컴포넌트 추가
- ✅ 임시저장 버튼 추가
- ✅ URL 파라미터로 임시저장 불러오기
- ✅ 완료된 캠페인 불러오기

### 5. 사이드바 메뉴 추가 (`src/components/AdminSidebar.tsx`)
- ✅ 임시저장 메뉴 활성화
- ✅ `/dashboard/campaign/drafts` 링크

---

## 🎯 주요 기능

### 1. 임시저장
```typescript
// 임시저장 버튼 클릭
handleSaveDraft()
  ↓
saveDraft(userId, {
  title: "캠페인 제목",
  campaignType: "delivery",
  step1Data: {...},
  step2Data: {...},
  currentStep: 2
})
  ↓
localStorage에 저장 (최대 10개)
```

**특징:**
- 자동 제목 생성 (step2Data.campaignTitle || step1Data.productName)
- 현재 단계 저장
- 최신순 정렬
- 10개 초과 시 가장 오래된 항목 자동 삭제

---

### 2. 캠페인 불러오기

#### 임시저장 캠페인
```
┌─────────────────────────────────────────┐
│ 📥 캠페인 불러오기                      │
│                                         │
│ [임시저장 캠페인 (3)] [이전 요청완료 (5)]│
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 🟣 배송체험단  📅 2025.01.22      │   │
│ │ [스킨베네핏] 스킨베네핏 헤어...    │   │
│ │ [작성하러 가기] [🗑️]              │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### 완료된 캠페인
```
┌─────────────────────────────────────────┐
│ 📥 캠페인 불러오기                      │
│                                         │
│ [임시저장 캠페인 (3)] [이전 요청완료 (5)]│
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 🟢 방문체험단  📅 2025.01.15      │   │
│ │ 강남 카페 체험단                   │   │
│ │ [불러오기]                         │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

### 3. 임시저장 페이지

```
임시저장 캠페인
작성 중이던 캠페인을 이어서 작성하거나 삭제할 수 있습니다. (최대 10개)

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🟣 배송체험단 │ │ 🟣 방문체험단 │ │ 🟣 기자단     │
│ [🗑️]         │ │ [🗑️]         │ │ [🗑️]         │
│              │ │              │ │              │
│ 스킨베네핏... │ │ 강남 카페... │ │ 웹서비스...  │
│              │ │              │ │              │
│ Step 2/3     │ │ Step 1/3     │ │ Step 3/3     │
│ ████████░░   │ │ ███░░░░░░░   │ │ ██████████   │
│              │ │              │ │              │
│ 📅 2025.01.22│ │ 📅 2025.01.20│ │ 📅 2025.01.18│
│              │ │              │ │              │
│ [✏️ 작성하러 가기 →]│ │ [✏️ 작성하러 가기 →]│ │ [✏️ 작성하러 가기 →]│
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📊 데이터 구조

### DraftCampaign Interface
```typescript
interface DraftCampaign {
    id: string;                    // draft_1234567890_abc123
    userId: string;                // Supabase user ID
    title: string;                 // 캠페인 제목
    campaignType: 'delivery' | 'visit' | 'press';
    step1Data: any;                // Step 1 폼 데이터
    step2Data?: any;               // Step 2 폼 데이터
    currentStep: number;           // 1, 2, 3
    createdAt: string;             // ISO 8601
    updatedAt: string;             // ISO 8601
}
```

### localStorage 저장 형식
```json
{
  "campaign_drafts": [
    {
      "id": "draft_1737524619_abc123",
      "userId": "user-uuid-here",
      "title": "[스킨베네핏] 스킨베네핏 헤어쿠션 9g",
      "campaignType": "delivery",
      "step1Data": {...},
      "step2Data": {...},
      "currentStep": 2,
      "createdAt": "2025-01-22T08:30:19.000Z",
      "updatedAt": "2025-01-22T09:15:42.000Z"
    }
  ]
}
```

---

## 🔄 사용 흐름

### 시나리오 1: 임시저장 후 나중에 이어서 작성
```
1. 사용자가 Step 1 완료
2. Step 2 작성 중
3. [임시저장] 버튼 클릭
   → "임시저장되었습니다" 토스트
4. 페이지 이탈

--- 나중에 ---

5. 사이드바 > 임시저장 메뉴 클릭
6. 임시저장 목록에서 [작성하러 가기] 클릭
7. Step 2부터 이어서 작성
```

### 시나리오 2: 캠페인 불러오기에서 불러오기
```
1. 신규 캠페인 페이지 접속
2. [캠페인 불러오기] 섹션 펼치기
3. [임시저장 캠페인] 탭 선택
4. 원하는 캠페인 [작성하러 가기] 클릭
5. 해당 Step부터 이어서 작성
```

### 시나리오 3: 완료된 캠페인 재사용
```
1. 신규 캠페인 페이지 접속
2. [캠페인 불러오기] 섹션 펼치기
3. [이전 요청완료 캠페인] 탭 선택
4. 원하는 캠페인 [불러오기] 클릭
5. Step 1부터 데이터가 채워진 상태로 시작
```

---

## ⚙️ 기술 구현

### 1. 사용자별 필터링
```typescript
const getUserDrafts = (userId: string): DraftCampaign[] => {
    const allDrafts = JSON.parse(localStorage.getItem('campaign_drafts'));
    return allDrafts
        .filter(draft => draft.userId === userId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10);  // 최대 10개
};
```

### 2. 10개 제한 로직
```typescript
const saveDraft = (userId, data) => {
    // 사용자의 임시저장만 추출
    const userDrafts = allDrafts.filter(d => d.userId === userId);
    const otherDrafts = allDrafts.filter(d => d.userId !== userId);
    
    // 최신순 정렬 후 10개만 유지
    const limitedUserDrafts = userDrafts
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10);
    
    // 다시 합치기
    const finalDrafts = [...otherDrafts, ...limitedUserDrafts];
    localStorage.setItem('campaign_drafts', JSON.stringify(finalDrafts));
};
```

### 3. URL 파라미터로 불러오기
```typescript
// URL: /dashboard/campaign/new?draftId=draft_1234567890_abc123

const loadUserAndDraft = async () => {
    const draftId = searchParams?.get('draftId');
    if (draftId) {
        const draft = loadDraft(userId, draftId);
        if (draft) {
            setCurrentStep(draft.currentStep);
            setStep1Data(draft.step1Data);
            setStep2Data(draft.step2Data);
        }
    }
};
```

---

## 🎨 UI/UX 특징

### 1. 색상 구분
- **임시저장**: 🟣 보라색 (Purple)
- **완료된 캠페인**: 🟢 녹색 (Green)
- **임시저장 버튼**: 🟣 보라색 (bg-purple-500)

### 2. 진행 상태 표시
```
Step 2/3
████████░░ (66%)
```

### 3. 툴팁
```
💡 임시저장은 최대 10개까지 저장됩니다. 
   10개를 초과하면 가장 오래된 항목이 자동으로 삭제됩니다.
```

---

## ✅ 완료 체크리스트

- [x] 임시저장 유틸리티 함수 구현
- [x] 캠페인 불러오기 컴포넌트 구현
- [x] 임시저장 페이지 구현
- [x] 신규 캠페인 페이지에 통합
- [x] 사이드바 메뉴 추가
- [x] 최대 10개 제한 구현
- [x] 작성하러 가기 기능
- [x] 삭제 기능
- [x] 완료된 캠페인 불러오기
- [x] 툴팁 추가

---

## 🚀 다음 단계

1. **Supabase 연동** (선택사항)
   - localStorage 대신 Supabase 테이블 사용
   - 다른 기기에서도 접근 가능

2. **자동 임시저장**
   - 일정 시간마다 자동 저장
   - 페이지 이탈 시 자동 저장

3. **임시저장 공유**
   - 팀원과 임시저장 공유 기능

4. **버전 관리**
   - 임시저장 히스토리 관리
   - 이전 버전으로 복원

---

모든 임시저장 기능이 완벽하게 구현되었습니다! 🎉
