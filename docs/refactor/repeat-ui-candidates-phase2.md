# 반복 UI 공통화 후보 (Phase 2)

기준: 오픈 안정성 우선, 영향 범위 대비 효과가 큰 순서.

## 우선순위 A (즉시 권장)

| 영역 | 파일 | 반복 패턴 | 제안 컴포넌트 | 리스크 |
|---|---|---|---|---|
| 캠페인 작성 | `/src/components/campaign/CampaignStep1.tsx` | 다수 `<button>` + 토글 버튼 스타일 중복 | `OptionToggleCard`, `RadioOptionCard` | 중간 (폼 로직 결합) |
| 캠페인 작성 | `/src/components/campaign/CampaignStep2.tsx` | 이미지/태그/링크 add/remove 액션 버튼 반복 | `InlineIconButton`, `TagChip` | 중간 |
| 캠페인 작성 | `/src/components/campaign/CampaignStep3.tsx` | 결제 수단 선택 카드 버튼 반복 | `SelectablePaymentCard` | 중간 |
| 관리자 결제 | `/src/components/admin/PaymentManagementClient.tsx` | 필터 탭/새로고침 버튼 반복 | `FilterTabGroup`, `IconGhostButton` | 낮음 |
| 관리자 쿠폰 | `/src/components/admin/CouponManagementClient.tsx` | 헤더/테이블 액션 버튼 반복 | `SectionActionBar`, `IconGhostButton` | 낮음 |

## 우선순위 B (2차 안정화 후)

| 영역 | 파일 | 반복 패턴 | 제안 컴포넌트 | 리스크 |
|---|---|---|---|---|
| 관리자 심사 | `/src/components/admin/InfluencerReviewModal.tsx` | 승인/거절/태그 액션 버튼 반복 | `DecisionButtonGroup` | 중간 |
| 관리자 신청 | `/src/components/admin/applications-columns.tsx` | 행 단위 상태/액션 버튼 반복 | `RowActionButtons` | 중간 |
| 공통 로더/성공 | `/src/components/campaign/CampaignLoader.tsx`, `/src/components/campaign/CampaignSuccess.tsx` | CTA 버튼 조합 반복 | `PrimarySecondaryActions` | 낮음 |

## 우선순위 C (디자인 일괄 반영 단계)

| 영역 | 파일 | 반복 패턴 | 제안 컴포넌트 | 리스크 |
|---|---|---|---|---|
| 전체 내비/알림 | `/src/components/Navbar.tsx`, `/src/components/NotificationCenter.tsx` | 작은 뱃지/아이콘 버튼 반복 | `TinyBadge`, `RoundIconButton` | 낮음 |
| 인증/온보딩 | `/src/components/OnboardingModal.tsx`, `/src/app/signup/page.tsx` | 선택 카드/CTA 버튼 반복 | `SelectableRoleCard` | 낮음 |

## 정량 근거 (`<button>` 출현 상위)

- `23`회: `/src/components/campaign/CampaignStep1.tsx`
- `14`회: `/src/components/campaign/CampaignStep2.tsx`
- `10`회: `/src/components/admin/CouponManagementClient.tsx`
- `9`회: `/src/components/campaign/CampaignStep3.tsx`
- `8`회: `/src/components/admin/InfluencerReviewModal.tsx`

## 적용 원칙 (고정)

1. 공통 컴포넌트는 `UI-only`로 유지하고 비즈니스 분기 로직은 상위에서 주입
2. 상태/타입 값 비교는 `String(value).toUpperCase()`로 통일
3. DB 원문은 UI에 직접 노출하지 않고 라벨 맵을 거쳐 렌더
4. 디자인 변경은 공통 컴포넌트 레벨에서만 수행(“한 곳 수정 시 전체 반영”)

## Phase 2 구현 순서 제안

1. `IconGhostButton`, `FilterTabGroup` 추가 후 결제/쿠폰 화면 적용  
2. 캠페인 Step1/2/3 버튼 카드 추상화 (`OptionToggleCard`, `SelectablePaymentCard`)  
3. 관리자 모달/테이블 액션군 통합 (`DecisionButtonGroup`, `RowActionButtons`)
