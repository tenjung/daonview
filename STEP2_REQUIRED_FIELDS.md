# Step 2 필수 입력 조건 업데이트

## 📋 변경 사항

### 1. 방문 체험단/기자단 - 지도 삽입 필수

**적용 대상:**
- `campaignType === 'visit'` (방문체험단)
- `campaignType === 'press'` (기자단)
- `includeNaver === true` (블로그 선택 시)

**구현 내용:**
- ✅ 지도 삽입 체크박스 기본값: `true`
- ✅ 체크박스 비활성화 (disabled)
- ✅ 필수 표시 (*) 추가
- ✅ 안내 메시지: "방문체험단/기자단은 지도 삽입이 필수입니다."
- ✅ 유효성 검사: `blogMapRequired`가 false면 폼 제출 불가

**UI 변경:**
```tsx
{/* 방문체험단/기자단의 경우 */}
<input
    type="checkbox"
    checked={formData.blogMapRequired}
    disabled={true}  // 비활성화
    className="... disabled:opacity-50 disabled:cursor-not-allowed"
/>
<span>
    지도 삽입 필수
    <span className="text-red-500 ml-1">*</span>
</span>
```

---

### 2. 배송 체험단 - 쇼핑몰 링크 삽입 필수

**적용 대상:**
- `campaignType === 'delivery'` (배송체험단)
- `includeNaver === true` (블로그 선택 시)

**구현 내용:**
- ✅ 필수 표시 (*) 추가
- ✅ 안내 메시지: "배송체험단은 쇼핑몰 링크를 최소 1개 이상 추가해야 합니다."
- ✅ placeholder 변경: "쇼핑몰 링크 입력 후 Enter"
- ✅ 유효성 검사: `blogRequiredLinks.length === 0`이면 폼 제출 불가

**UI 변경:**
```tsx
{/* 배송체험단의 경우 */}
<label>
    필수 삽입 링크
    <span className="text-red-500 ml-1">*</span>
</label>
<p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
    ℹ️ 배송체험단은 쇼핑몰 링크를 최소 1개 이상 추가해야 합니다.
</p>
<input
    placeholder="쇼핑몰 링크 입력 후 Enter"
/>
```

---

## 🔍 유효성 검사 로직

```typescript
const isFormValid = () => {
    // ... 기존 검사 ...

    // 방문체험단/기자단 + 블로그: 지도 삽입 필수
    if ((step1Data.campaignType === 'visit' || step1Data.campaignType === 'press') 
        && step1Data.includeNaver) {
        if (!formData.blogMapRequired) {
            return false;
        }
    }

    // 배송체험단 + 블로그: 쇼핑몰 링크 삽입 필수
    if (step1Data.campaignType === 'delivery' && step1Data.includeNaver) {
        if (formData.blogRequiredLinks.length === 0) {
            return false;
        }
    }

    return true;
};
```

---

## 📊 시나리오별 동작

### 시나리오 1: 방문체험단 + 블로그
1. 블로그 가이드 섹션 표시
2. **지도 삽입 필수** 체크박스:
   - ✅ 기본값: 체크됨 (true)
   - ✅ 비활성화 (해제 불가)
   - ✅ 빨간색 * 표시
   - ✅ 안내 메시지 표시
3. 필수 삽입 링크: 선택사항

### 시나리오 2: 기자단 + 블로그
1. 블로그 가이드 섹션 표시
2. **지도 삽입 필수** 체크박스:
   - ✅ 기본값: 체크됨 (true)
   - ✅ 비활성화 (해제 불가)
   - ✅ 빨간색 * 표시
   - ✅ 안내 메시지 표시
3. 필수 삽입 링크: 선택사항

### 시나리오 3: 배송체험단 + 블로그
1. 블로그 가이드 섹션 표시
2. 지도 삽입 필수: 선택사항 (체크박스 활성화)
3. **필수 삽입 링크**:
   - ✅ 빨간색 * 표시
   - ✅ 안내 메시지 표시
   - ✅ placeholder: "쇼핑몰 링크 입력 후 Enter"
   - ✅ 최소 1개 이상 링크 추가 필수

---

## ✅ 완료된 작업

1. ✅ 방문체험단/기자단 지도 삽입 기본값 true 설정
2. ✅ 방문체험단/기자단 지도 삽입 체크박스 비활성화
3. ✅ 방문체험단/기자단 지도 삽입 필수 표시 및 안내 메시지
4. ✅ 배송체험단 쇼핑몰 링크 필수 표시 및 안내 메시지
5. ✅ 배송체험단 쇼핑몰 링크 placeholder 변경
6. ✅ 유효성 검사 로직 추가
7. ✅ UI 스타일링 (amber 색상 안내 박스)

---

## 🎨 UI 개선사항

### 안내 메시지 스타일
```tsx
<p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
    ℹ️ 안내 메시지
</p>
```

- **색상**: amber (주황색 계열)
- **배경**: 연한 amber (bg-amber-50)
- **테두리**: amber-200
- **아이콘**: ℹ️ (정보 아이콘)

### 필수 표시
```tsx
<span className="text-red-500 ml-1">*</span>
```

- **색상**: 빨간색 (text-red-500)
- **위치**: 레이블 오른쪽

---

## 🚀 테스트 방법

1. **방문체험단 + 블로그 테스트**
   - Step 1에서 방문체험단 선택 + 네이버 블로그 선택
   - Step 2로 이동
   - 블로그 가이드 섹션에서 "지도 삽입 필수" 확인
   - 체크박스가 체크되어 있고 비활성화되어 있는지 확인
   - 안내 메시지 표시 확인

2. **배송체험단 + 블로그 테스트**
   - Step 1에서 배송체험단 선택 + 네이버 블로그 선택
   - Step 2로 이동
   - 블로그 가이드 섹션에서 "필수 삽입 링크" 확인
   - 빨간색 * 표시 확인
   - 안내 메시지 표시 확인
   - 링크 추가 없이 다음 단계 시도 → 에러 메시지 확인

---

## 📝 결론

이제 캠페인 유형에 따라 블로그 가이드의 필수 입력 조건이 자동으로 적용됩니다:

- **방문체험단/기자단**: 지도 삽입 필수 (자동 체크, 해제 불가)
- **배송체험단**: 쇼핑몰 링크 1개 이상 필수

사용자는 명확한 안내 메시지와 시각적 표시를 통해 필수 입력 사항을 쉽게 인지할 수 있습니다.
