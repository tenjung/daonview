# Step 2 미션 가이드 입력 폼 - 구현 완료

## 📋 개요
Step 1에서 선택한 채널 조합(구매평 단독 vs 구매평+블로그 vs 구매평+인스타)에 따라 Step 2 입력 폼 구성이 동적으로 변경되도록 구현했습니다.

## 🎯 구현된 기능

### 1. 동적 렌더링 로직

#### Section A: 구매평 미션 가이드 (고정)
**표시 조건:** `step1Data.campaignType === 'delivery' && step1Data.includeReview`

**입력 필드:**
- ✅ 구매 링크 (URL) - 필수
  - Step 1에서 입력한 상품 링크가 자동으로 채워짐
- ✅ 구매 옵션/키워드
  - 예: "검색창에 '무설탕' 검색 후 3번째 상품 클릭"
- ✅ 페이백 금액
  - 리뷰어에게 돌려줄 금액 (자동 계산 추천)
- ✅ 구매 시 주의사항
  - 예: 비공개 요청, 쿠폰 사용 금지 등
- ✅ 미션 내용
  - 예: "찜하기 필수", "포토리뷰 필수"
- ✅ 경제적 대가 고지 문구 안내

**UI 특징:**
- 🛒 아이콘과 "구매평 미션 가이드" 타이틀
- 파란색 테두리 (border-blue-200)
- 그라데이션 구분선

---

#### Section B-1: 블로그 포스팅 가이드 (가변)
**표시 조건:** `step1Data.includeNaver === true`

**입력 필드:**
- ✅ 메인 키워드 - 필수
  - 상위 노출 목표 키워드
- ✅ 서브 키워드 (배열)
  - 본문에 포함할 단어들
  - 동적 추가/삭제 가능
- ✅ 제목 가이드
  - 예: "키워드를 제목 앞부분에 배치해주세요"
- ✅ 지도 삽입 여부 (체크박스)
  - MapPin 아이콘과 함께 표시
- ✅ 필수 삽입 링크 (배열)
  - 스마트플레이스, 예약 링크 등
  - URL 형식으로 입력
  - 동적 추가/삭제 가능

**UI 특징:**
- 📝 아이콘과 "블로그 리뷰 미션" 타이틀
- 녹색 테두리 (border-green-200)
- 그라데이션 구분선

---

#### Section B-2: 인스타그램 포스팅 가이드 (가변)
**표시 조건:** `step1Data.includeInstagram === true`

**입력 필드:**
- ✅ 필수 해시태그 (배열)
  - 자동으로 # 기호 추가
  - 예: #맛집 #OO동카페
  - 동적 추가/삭제 가능
- ✅ 계정 태그 (@)
  - 사진에 태그할 공식 계정 ID
  - 예: @your_brand_account
- ✅ 촬영 가이드
  - 예: "제품 상세컷 2장 이상, 동영상 1개 필수"
- ✅ 릴스(Reels) 여부 (체크박스)
  - 🎬 아이콘과 함께 표시

**UI 특징:**
- 📸 아이콘과 "인스타그램 리뷰 미션" 타이틀
- 핑크색 테두리 (border-pink-200)
- 그라데이션 구분선

---

### 2. 공통 섹션

#### 캠페인 제목
- Step 1의 상품명을 활용한 placeholder
- 예: "{상품명} 체험단 모집"

#### 캠페인 이미지
- 대표 이미지 1개 (필수)
- 상세 이미지 최대 3개
- "나중에 업로드하기" 옵션

#### 리뷰 작성 가이드
- 글자 수 선택 (자유/20자/150자/300자/직접작성)
- 사진 업로드 조건 (1장/3장/5장/미포함)
- 동영상 포함 여부
- 작성 가이드 (자유 입력)

#### 필수 키워드
- 동적 추가/삭제
- # 기호와 함께 표시

#### 금지 키워드
- 동적 추가/삭제
- 경쟁사 이름, 금지어 등

#### 추가 안내사항
- 자유 입력 텍스트 영역

---

## 🎨 UI 디자인 가이드

### 섹션 구분
- **Section A (구매평)**: 파란색 테두리 + 🛒 아이콘
- **Section B-1 (블로그)**: 녹색 테두리 + 📝 아이콘
- **Section B-2 (인스타)**: 핑크색 테두리 + 📸 아이콘

### 헤더 강조
- 각 섹션 상단에 아이콘 + 타이틀
- 그라데이션 구분선으로 시각적 분리

### 여백 및 간격
- 섹션 간 `space-y-8` (2rem)
- 섹션 내부 필드 간 `mb-6` (1.5rem)

---

## 🔧 기술 구현

### 데이터 구조

```typescript
interface Step1Data {
    campaignType: 'delivery' | 'visit' | 'press' | null;
    includeReview: boolean;
    includeNaver: boolean;
    includeInstagram: boolean;
    productUrl: string;
    productName: string;
    platform: 'naver' | 'instagram' | null;
}

interface Step2Data {
    // 구매평 가이드
    purchaseLink: string;
    purchaseOption: string;
    paybackAmount: string;
    purchaseNotes: string;
    reviewMissionContent: string;
    
    // 블로그 가이드
    blogMainKeyword: string;
    blogSubKeywords: string[];
    blogTitleGuide: string;
    blogMapRequired: boolean;
    blogRequiredLinks: string[];
    
    // 인스타그램 가이드
    instagramHashtags: string[];
    instagramAccountTag: string;
    instagramPhotoGuide: string;
    instagramReelsRequired: boolean;
    
    // 공통 필드들...
}
```

### 조건부 렌더링

```typescript
const isDeliveryCampaign = step1Data.campaignType === 'delivery';
const showReviewGuide = isDeliveryCampaign && step1Data.includeReview;
const showBlogGuide = step1Data.includeNaver;
const showInstagramGuide = step1Data.includeInstagram;
```

### 유효성 검사

```typescript
const isFormValid = () => {
    if (!formData.campaignTitle.trim()) return false;
    if (!uploadLater && formData.campaignImages.length === 0) return false;
    
    // 배송체험단 + 구매평 선택 시 구매 링크 필수
    if (step1Data.campaignType === 'delivery' && step1Data.includeReview) {
        if (!formData.purchaseLink.trim()) return false;
    }
    
    // 블로그 선택 시 메인 키워드 필수
    if (step1Data.includeNaver && !formData.blogMainKeyword.trim()) {
        return false;
    }
    
    return true;
};
```

---

## 📊 사용 시나리오

### 시나리오 1: 구매평 단독
- ✅ Section A (구매평 가이드) 표시
- ❌ Section B 숨김

### 시나리오 2: 구매평 + 블로그
- ✅ Section A (구매평 가이드) 표시
- ✅ Section B-1 (블로그 가이드) 표시
- ❌ Section B-2 숨김

### 시나리오 3: 구매평 + 인스타그램
- ✅ Section A (구매평 가이드) 표시
- ❌ Section B-1 숨김
- ✅ Section B-2 (인스타그램 가이드) 표시

### 시나리오 4: 블로그 단독
- ❌ Section A 숨김
- ✅ Section B-1 (블로그 가이드) 표시
- ❌ Section B-2 숨김

### 시나리오 5: 인스타그램 단독
- ❌ Section A 숨김
- ❌ Section B-1 숨김
- ✅ Section B-2 (인스타그램 가이드) 표시

---

## ✅ 완료된 작업

1. ✅ CampaignStep2.tsx 완전 리팩토링
2. ✅ Step1Data 인터페이스 정의 및 prop 추가
3. ✅ 동적 섹션 렌더링 로직 구현
4. ✅ 구매평 가이드 필드 구현
5. ✅ 블로그 가이드 필드 구현
6. ✅ 인스타그램 가이드 필드 구현
7. ✅ 해시태그 자동 # 추가 기능
8. ✅ 배열 필드 동적 추가/삭제 기능
9. ✅ UI 디자인 가이드 적용 (아이콘, 색상, 구분선)
10. ✅ 유효성 검사 로직 구현
11. ✅ 부모 컴포넌트에 step1Data prop 전달

---

## 🎉 결과

이제 Step 2 폼은 Step 1에서 선택한 채널 조합에 따라 완전히 동적으로 변경됩니다:

- **구매평 선택 시**: 쇼핑몰 구매 관련 필드 표시
- **블로그 선택 시**: SEO 키워드, 지도 삽입, 링크 삽입 필드 표시
- **인스타그램 선택 시**: 해시태그, 계정 태그, 릴스 필드 표시

각 섹션은 명확한 시각적 구분(아이콘, 색상, 구분선)을 통해 사용자가 쉽게 이해할 수 있도록 디자인되었습니다.
