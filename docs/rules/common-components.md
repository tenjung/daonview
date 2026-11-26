# 공통 디자인·컴포넌트 관리 규칙 (필수)

> 이 문서는 **모든 화면 작업 전에 반드시 확인**해야 하는 최우선 규칙이다. (AGENTS.md 0-2 참조)
> 목표: **같은 UI·같은 의미는 한 곳에서만 정의**하고, 한 번 고치면 모든 화면(관리자·광고주·인플루언서·공개면)에 함께 반영되게 한다. 이중 수정이 생기는 구조는 만들지 않는다.

## 1. 원칙

1. **먼저 찾고, 있으면 쓴다.** 새 UI를 만들기 전에 아래 "공통 컴포넌트 목록"과 `src/components/`를 검색한다. 같은 역할의 부품이 있으면 그대로 쓴다.
2. **비슷한 것이 두 곳 이상이면 공통으로 뺀다.** 화면 A에 이미 있는 카드·배지·모달을 화면 B에서도 쓰게 되면, B에 복사하지 말고 A의 것을 공통 컴포넌트로 분리해 둘 다 그것을 쓰게 바꾼다.
3. **라벨·색·상태값 매핑은 상수 한 곳에만.** DB 값(UPPERCASE) → 화면 라벨·색은 `src/constants/`에만 정의하고, 화면 안에 `status === 'X' ? '라벨' : ...` 식의 매핑이나 색 분기를 만들지 않는다.
4. **역할별(관리자/광고주/인플루언서) 복붙 금지.** 역할마다 다른 것은 props·래퍼·권한으로 처리하고, 본체 컴포넌트는 하나만 둔다.
5. **디자인 변경은 공통 컴포넌트에서.** 색·크기·간격을 바꿀 때는 개별 화면이 아니라 공통 컴포넌트(또는 상수)를 고친다. 개별 화면에서 `className`으로 덮어써 모양을 바꾸지 않는다(배치·여백 조정만 허용).
6. **공통 컴포넌트를 만들거나 바꾸면 이 문서 목록을 같이 갱신한다.**

## 2. 작업 절차 (체크리스트)

- [ ] 요청 화면에 들어갈 UI 요소(배지, 카드, 표, 모달, 제목, 통계, 빈 상태 등)를 나열했다.
- [ ] 각 요소를 아래 목록과 `src/components/`에서 검색했다. (예: `grep -rn "Badge\|Card\|Dialog" src/components`)
- [ ] 같은 기능이 다른 화면에 이미 있으면 **공통으로 분리하는 계획**을 [분석 리포트]에 넣었다.
- [ ] 라벨·색은 `src/constants/`에 추가했고 화면에는 매핑을 두지 않았다.
- [ ] 관리자·광고주·인플루언서 화면 중 같은 부품을 쓰는 곳을 모두 확인했다(한쪽만 바뀌지 않게).
- [ ] 이 문서의 목록을 갱신했다.

## 3. 공통 컴포넌트 목록

### 3-1. 대시보드 공통 (`src/components/dashboard/`)
| 컴포넌트 | 용도 | 사용 규칙 |
|---|---|---|
| `DashboardPageLayout` | 역할별 사이드바 + 본문 틀 | 관리자·광고주·인플루언서 모든 대시보드 페이지. 관리자는 `AdminPageLayout`(래퍼) 사용 가능 |
| `DashboardPageHeader` | 페이지 제목 영역(아이콘·한국어 제목·설명·오른쪽 액션) | 페이지 `<h1>` 직접 작성 금지 |
| `StatTile`, `StatTileGroup` | 통계 숫자 타일 | 통계 카드 새로 만들지 않기 |
| `StatusBadge` | 상태 배지(의미별 색 + 점) | `domain` + `status`만 넘긴다. 라벨·색은 `constants/status.ts` |
| `SelectionMessagePreviewModal` | 선정 안내 미리보기(메일·카톡 탭, 발송 전 점검·링크·카톡 이력) 후 최종 발송 | 메일 재발송·카톡 발송은 반드시 이 모달을 거친다. 내용은 서버 `selectionPreviewServer`가 실제 발송과 같은 함수로 만들고, 지문(hash)이 같을 때만 발송. 카톡 탭은 관리자만 |

### 3-2. 캠페인 공통 (`src/components/campaign/`)
| 컴포넌트 | 용도 |
|---|---|
| `TypeBadge` (`CampaignBadges.tsx`) | 캠페인 유형 배지(배송/방문/기자단) |
| `PlatformBadge`, `CampaignPlatformBadges` | 참여 플랫폼 배지(구매평/블로그/인스타) — 메인 카드와 동일 |

### 3-3. 표·데이터 (`src/components/admin/`, `src/components/data-table/`)
| 컴포넌트 | 용도 | 사용 규칙 |
|---|---|---|
| `CampaignDataTable` + 역할별 래퍼 | 관리자·광고주 캠페인 목록/운영 | 역할별 분리 구현 금지 |
| `ApplicationsTableClient` | 캠페인 신청자 표(관리자·광고주 공용) | 신청자 관련 기능은 여기 한 곳에 |
| `StatusBadgeCell` | 표 안의 상태 셀 | 내부적으로 `StatusBadge` 사용 |

### 3-3-0. 디자인 기준 부품
| 요소 | 용도 | 사용 규칙 |
|---|---|---|
| `Button` (`src/components/ui/button.tsx`) | 모든 버튼. size `sm`32·`default`40·`lg`44·`bottom`48, 모서리 8px | 화면에서 높이·글자 덮어쓰기 금지. 기준은 `docs/rules/design.md` 3.8 |
| `tailwind.config.ts` 글꼴·굵기·크기 토큰 | Pretendard 단일 글꼴, 굵기 400~700, `text-2xs`(11)·`text-body-sm`(13) | 임의 px 크기·800/900 굵기 금지 |

### 3-3-1. 메일 (`src/lib/email.ts`)
| 요소 | 용도 | 사용 규칙 |
|---|---|---|
| `EMAIL_STYLE`, `EMAIL_BUTTON_COLORS` | 메일 글자·여백·버튼 색 기준(시안 A 컴팩트형: 본문 14px, 제목 18px, 버튼 높이 약 42px, 여백 16px) | 메일 크기·색은 여기서만 바꾼다 |
| `wrapEmailLayout` | 모든 코드 메일의 공통 틀(머리·분홍 띠 제목·본문·하단 카톡 문의/수신거부) | 새 메일은 이 틀로 만든다. DB 조각 템플릿도 이 틀로 감싼다 |
| `emailButtons`, `emailInfoTable`, `buildSelectionDetailsHtml` | 버튼 1~2개 한 줄, 라벨/값 정보 표, 선정·진행 안내 상세 표 | 메일마다 버튼·표를 따로 만들지 않는다 |

### 3-4. 상수 (단일 출처)
| 파일 | 내용 |
|---|---|
| `src/constants/status.ts` | `STATUS_DOMAINS` — 신청·인플루언서 신청·캠페인·리뷰·인플루언서 리뷰·결제·환불·쿠폰·문의·제휴문의 라벨 + 톤 |
| `src/constants/campaign.ts` | 캠페인 상태 라벨, 활성 상태 목록 |
| `src/constants/navigation.ts` | 역할별 사이드바 메뉴 (`*_NAV`) |
| `src/constants/role.ts` | 역할 라벨·대시보드 경로 |

### 3-4-1. 리뷰 공통 (`src/components/reviews/`)
| 컴포넌트 | 용도 | 사용 규칙 |
|---|---|---|
| `ReviewDetailCard` | 리뷰 상세(작성자·링크·상태·구매평 증빙·페이백 계좌·승인/거절/숨김) | 리뷰 관리 화면 목록과 신청자 표 리뷰 상세 모달이 함께 사용. 리뷰 표시·상태 변경은 여기만 수정. 관리자·광고주 전용이라 페이백 계좌번호는 입금 편의를 위해 항상 전체 표시 |

### 3-5. 데이터 저장 공통 (`src/lib/`)
| 함수 | 용도 |
|---|---|
| `updateMyProfile` (`lib/profile/updateMyProfile.ts`) | 본인 프로필 저장(세션 사용자 기준, 0건 저장 실패 처리). 브라우저에서 `profiles` 직접 update 금지 |
| `getManagedReviewsForActor` (`lib/reviews/management.ts`) | 역할 권한에 맞춘 리뷰 목록 + 증빙 서명 URL. `{ campaignId }`로 캠페인 한정 조회(광고주는 본인 캠페인만) |

## 4. 남은 중복·정리 대상 (발견 시 여기에 추가)

| 항목 | 상태 | 비고 |
|---|---|---|
| 리뷰 상세 카드 | ✅ 완료(2026-11-25) | `ReviewDetailCard`로 분리, 리뷰 관리·신청자 표 모달 공용 |
| `*_LINKS` 메뉴 상수 | 중복 이름 | `*_NAV`의 별칭. 하나로 정리 여부 결정 필요 |
| `InfluencerMobileHeader`, `ui/stat-card`, `admin/InfluencerStatsCard` | 미사용 | 삭제 여부 결정 필요 |
| `InfluencerSummaryBanner` | 관심 캠페인 화면에서만 사용 | `StatTile`로 대체 검토 |
| 결제 관리 화면 매출 요약 카드 | 자체 카드 | `StatTile` 대체 검토 |

## 5. 금지 예시

- ❌ 신청자 표에 리뷰를 보여주려고 리뷰 관리 화면의 카드를 복사해서 새로 만듦 → ✅ 카드를 공통 컴포넌트로 빼서 양쪽이 사용
- ❌ 화면 안에서 `status === 'APPROVED' ? 'bg-green-100' : ...` → ✅ `<StatusBadge domain="REVIEW" status={status} />`
- ❌ 메인 카드에 배지가 있는데 관리자 카드에 배지를 새로 그림 → ✅ `TypeBadge`·`CampaignPlatformBadges` 재사용
- ❌ 광고주용·관리자용 표를 각각 구현 → ✅ 공용 표 + 역할별 래퍼
