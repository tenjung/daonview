# Daonview UI/UX Design Rules

> **필수 선행 규칙:** 화면 작업 전 [공통 디자인·컴포넌트 관리 규칙](./common-components.md)을 먼저 확인한다. 같은 UI·같은 의미는 공통 컴포넌트·상수 한 곳에서만 정의한다.

## 1. 앱-라이크 모바일 컨테이너 원칙 (App-like Mobile Container Rule)

웹 기반의 대시보드 및 관리자 페이지를 모바일 기기에서도 **네이티브 앱(Native App)과 동일한 꽉 찬 레이아웃**으로 제공하기 위한 UI 최적화 방법론입니다. 낭비되는 구석 여백을 제거하고 핵심 데이터의 가시성을 극대화합니다.

### 📌 반응형 기준점 (Breakpoints) 정의
이 문서에서 지칭하는 "모바일"과 "웹(데스크탑)"의 기준은 Tailwind CSS의 `sm` 브레이크포인트를 따릅니다.
- **모바일 (Mobile):** 화면 폭 `640px` 미만 (기본 클래스 적용, 예: `p-0`)
- **웹/태블릿 (Web):** 화면 폭 `640px` 이상 (`sm:` 접두사 클래스 적용, 예: `sm:p-4`, `md:p-6`)

### 1.1 Edge-to-Edge 레이아웃 (Edge 여백 제거)
모바일 기기의 작은 화면 폭을 100% 활용하기 위해, 최상단 컨테이너(Wrapper)의 좌우 패딩을 과감하게 `0`으로 설정하여 모서리 끝에서 끝까지 콘텐츠를 채웁니다. 단, 태블릿/PC 환경(`sm` 사이즈 이상)에서는 정상적인 레이아웃 구조를 복구해야 합니다.
- **적용 패턴:** `p-0 sm:p-4 md:p-6` 또는 `px-0 sm:px-6`
- **적용 대상:** `AdminPageLayout.tsx` 등 레이아웃 외곽 컨테이너

### 1.2 Full-Bleed 데이터 테이블 (테두리 및 라운드 최적화)
데이터가 많은 표(`DataTable`)나 박스는 화면 좌우 끝에 위치할 경우, 테두리(Border)와 둥근 모서리(Border-Radius)가 오히려 시각적으로 답답함을 줍니다. 모바일 환경에 한해 좌우 라운딩 및 보더를 해제합니다.
- **모바일 룰:** 모서리 없음(`rounded-none`), 상하 1픽셀 테두리(`border-y`)만 유지 (좌우 차단선 없음)
- **데스크탑 룰:** 둥근 모서리 복구(`sm:rounded-md`), 전체 테두리 박스 뷰 복구(`sm:border`)
- **적용 패턴:** `rounded-none sm:rounded-md border-y sm:border`

### 1.3 하이퍼-콤팩트 상단 & 헤더바 (수직 공간 절약)
화면 비율을 차지하는 상·하단 영역 요소(타이틀 배경, 설명 영역 등)의 불필요한 공백을 줄이고 컨텐츠 영역을 확보합니다.
- **적용 패턴:** 타이틀 상하단을 `py-8`에서 `py-4`로 절반으로 조정 (`py-4 sm:py-8`)
- **적용 패턴:** 제목과 아이콘 사이즈의 미세 축소 (`text-xl sm:text-3xl`, `w-6 h-6 sm:w-8 sm:h-8` 등)

### 1.4 인라인 컴포넌트 여백 독립화 (Safe Area 보정)
Edge-to-Edge 컨테이너 내부더라도 검색 인풋박스, 페이지네이션 숫자, 가로 스와이프 탭 등의 개별 인터페이스 요소들은 가장자리에 화면이 잘려 클릭이 어렵지 않도록 국소적 `px-4` 여백을 허용하여 디자인합니다.
- **적용 패턴:** `<div className="px-4 sm:px-0">` 

### 1.5 메트릭스 & 통계 카드의 프로그레시브 디스클로저
대시보드 성격의 카드들을 모바일에서 하나씩 적층시키면 세로 스크롤이 무한정 길어지는 현상을 방지하기 위해 핵심 지표 위주로 미니멀하게 설계합니다.
- 모바일 환경에서는 부가 설명 텍스트를 과감히 숨깁니다. (`hidden sm:block`)
- 숫자 지표 위주로 최소한의 아이콘을 배치하고, 모바일 한 로우(Row)에 가로로 2개~3개가 들어갈 수 있도록 그리드를 강제 분할합니다.
- **적용 패턴:** `grid grid-cols-2 sm:grid-cols-4` 또는 `grid-cols-3`

### 1.6 투명한 가로 스크롤바 (네이티브 스와이프 경험)
웹 브라우저의 두꺼운 회색 가로 스크롤바는 모바일 웹앱의 몰입도를 심하게 해칩니다. 스크롤바 막대기를 완전히 투명하게(`display: none`) 숨기고, 사용자들에게는 터치 기반의 네이티브 스와이프 상호작용만 제공합니다.
- **스타일 룰 (`globals.css`):** `.custom-scrollbar` 클래스를 생성하여 `-ms-overflow-style: none`, `scrollbar-width: none` 설정
- **적용 패턴:** 탭 리스트(`TabsList`)나 가로로 확장되는 데이터 테이블(`Table`) 컨테이너에 `.custom-scrollbar` 클래스 부여

### 1.7 테이블 긴 텍스트의 2단 압축 보호 (레이아웃 방어)
관리자나 사용자가 지나치게 긴 캠페인 제목(또는 텍스트)을 입력하더라도, 모바일 화면 레이아웃이 좌우로 무한정 늘어나는 현상을 하드 컷(Hard Cut)으로 방어합니다.
- **글자수 커팅:** 50자 이상의 글자는 25자 내외로 자른 후 `...` 처리
- **줄바꿈 방어:** CSS의 `line-clamp-2` 속성을 통해 어떠한 기기 폭에서도 최대 2줄을 넘지 않게 예외 상황 완벽 차단
- **적용 패턴:** `truncate` 대신 `break-keep line-clamp-2` 속성과 코드 단의 글자(`slice`) 커팅 조합 사용

### 1.8 뱃지(Badge) 블록의 Flex-nowrap 강제 수평화
플랫폼, 제공 내역, 위치 등 배지(Sticker/Badge) 컴포넌트가 여러 개 붙을 때 화면이 좁아지면 아래쪽으로 밀리면서(Wrap) 리스트 카드 전체 높이를 비정상적으로 키우는 것을 방지합니다.
- **수단 1 (부모):** 뱃지 그룹 컨테이너에 `flex-wrap` 대신 **무조건적인 `flex-nowrap`, `overflow-hidden`** 적용
- **수단 2 (자식):** 위치 뱃지는 `광역/상세`(예: `대구/수성구`, `경북/안동`)를 기본 표기로 유지하되, 뱃지 내부는 `truncate`로 폭 초과를 제어
- **적용 패턴:** `<div className="flex gap-1.5 flex-nowrap overflow-hidden">`

### 1.9 모바일 탭 메뉴의 균등 분할 (Flex-1 할당)
모바일 환경에서 상단 네비게이션 탭이나 하위 메뉴들이 한쪽으로 쏠리고 불필요한 빈 공간이 남는 것을 방지하기 위해, 남은 너비를 버튼들이 균등하게 나눠 갖도록 설정합니다.
- **모바일 룰:** 요소별 너비 등분(`flex-1`), 콘텐츠 중앙 정렬(`justify-center`, `text-center`) 적용
- **데스크탑 룰:** 버튼 글자 크기만큼만 영역 차지하도록 원복 (`sm:flex-none`)
- **버튼 텍스트 단축:** 모바일 폭의 부족을 해결하고자 불필요한 뒷글자('형', '보기')를 숨겨 짧은 키워드로 치환 (`<span className="sm:hidden">전체</span><span className="hidden sm:inline">전체보기</span>`)
- **적용 패턴:** `<button className="flex-1 sm:flex-none flex justify-center items-center">`

---

## 2. 다온뷰 브랜드 색상 규정 (Daonview Color System)

다온뷰의 시각적 정체성(Brand Identity)을 나타내는 색상 체계입니다. UI 요소는 일관된 사용자 경험을 위해 아래 지정된 메인 색상 및 서브 색상을 따릅니다.

### 2.1 메인 브랜드 색상: 로즈 핑크 (Rose Pink)
서비스의 가장 핵심적인 정체성을 나타내며 액션 유도 버튼(CTA), 활성화 탭, 메인 강조 텍스트에 사용합니다.
- **Primary Base (기본):** `#ff385c` (또는 `bg-rose-500`, Tailwind의 Rose 500~600 대역 활용)
- **Primary Light (라이트, 호버/배경용):** `#fb7185` (`bg-rose-400`, 옅은 배경은 `bg-rose-50`)
- **Primary Dark (다크, 클릭/깊이용):** `#e11d48` (`bg-rose-600`)
- **적용 패턴:** 예약, 구매, 설정 완료 등 핵심 사용자 액션 유도에 최우선적으로 적용합니다.

### 2.2 서브/보조 색상 (Sub Colors)
기능적 구분이나 정보의 신뢰감을 표현할 때 로즈 핑크의 보색 및 인접색으로 활용합니다.
- **신뢰/기술 (Blue & Indigo):** `#2563eb`(Blue), `#4f46e5`(Indigo) / 로고의 'View' 영역, 완료 및 성공 알림, 혹은 남성향/디지털 카테고리에 사용
- **보라/신비 (Violet):** `#b375f9` ~ `#7c3aed` / 그라데이션의 중간 포인트 컬러, 퍼포먼스나 프리미엄급 컴포넌트를 강조할 때 사용
- **중립/정보 (Slate/Gray):** `slate-900` (기본 텍스트), `slate-500` (서브 텍스트), `slate-100` (카드 및 필터 배경) / 쿨톤(Cool-tone) 베이스의 회색 계열을 사용하여 로즈 핑크와 대비되는 모던함 유지 지정

### 2.3 다온뷰 시그니처 그라데이션 (Daonview Gradient)
버튼, 브랜드 최상단 로고, 특수 뱃지 등 역동적인 프리미엄 느낌을 주어야 하는 곳에 사용합니다.
- **그라데이션 흐름:** 로즈레드(`#ff385c`) → 웜핑크(`#ff5a7b`) → 소프트 바이올렛(`#b375f9`)이 혼합된 형태
- **적용 패턴:** `bg-gradient-to-r from-rose-500 via-pink-400 to-indigo-500` 또는 `globals.css`의 `.brand-text-gradient` 사용

---

## 3. 타이포그래피 규정 (Typography Rules)

폰트는 가독성, 위계, 밀도(특히 모바일) 관점에서 통일된 규칙을 적용합니다.  
핵심 원칙은 **크기보다 위계**, **강조보다 일관성**입니다.

### 3.1 글꼴 (확정 2026-11-26)
- **글꼴은 `Pretendard` 하나만** 쓴다(사이트·관리자·메일). 다른 글꼴을 새로 불러오지 않는다.
- 정의는 `tailwind.config.ts`의 `fontFamily.sans` 한 곳. `globals.css` body와 `<body className="font-sans">`가 이를 따른다.
- 불러오기: `src/app/layout.tsx`에서 Pretendard **dynamic-subset** CSS 한 번(화면에 쓰인 글자 조각·굵기만 받음). CSS `@import` 금지.
- 표 숫자 정렬은 별도 글꼴(mono) 대신 `tabular-nums`를 쓴다(3단계에서 기존 `font-mono` 정리).
- 예외(정리 예정): 제휴 랜딩 제목의 `font-serif`(Noto Serif KR)는 3단계에서 Pretendard로 바꾼다.

### 3.2 텍스트 역할별 Weight 규칙
- **Page Title / Section Title:** `font-bold` (기본 700)
- **Global Navigation (1차):** `font-medium` 기본, 활성 상태 `font-semibold` 또는 `font-bold`
- **Filter / Tab (2차 조작 UI):** 기본 `font-medium`, 활성 상태만 `font-semibold`~`font-bold`
- **Body / Description:** 기본(400) 또는 `font-medium`
- **Badge / Label / Meta:** `font-semibold` (필요 시 `text-xs` 조합)
- **금지 규칙:** `font-black` 남용 금지 (브랜드 로고/히어로 타이틀 등 특수 영역만 예외)

### 3.3 크기 스케일 기본 가이드 (3.8 확정 기준이 우선)
- **본문:** `text-sm` ~ `text-base`
- **보조 텍스트/메타:** `text-xs` ~ `text-sm`
- **섹션 제목:** `text-lg` ~ `text-2xl`
- **페이지 메인 타이틀:** `text-2xl` ~ `text-4xl`
- 모바일에서는 크기 확대보다 `line-height`, `spacing`, `color contrast`로 위계를 우선 확보한다.

#### 역할별 기본값
- **Modal Title:** `text-xl sm:text-2xl` + `font-bold`
- **Section Title:** `text-lg sm:text-xl` + `font-bold`
- **Body / Input:** `text-base` + `font-normal`
- **Label / Button:** `text-sm` + `font-semibold`
- **Helper / Description:** `text-sm` + `font-normal`
- **Badge / Meta:** `text-xs` + `font-semibold`
- **최소 크기:** 특수한 데이터 밀집 UI가 아닌 일반 사용자 화면에서 임의값 `10px`~`11px` 사용을 금지한다.
- 같은 역할의 텍스트는 모바일/데스크탑에서 의미 없이 크기를 역전하거나 변경하지 않는다.

### 3.4 모바일 반응형 타이포 원칙
- 모바일에서 필터/보조 UI가 헤더(1차 내비)보다 강해지지 않게 조절한다.
- 긴 텍스트는 줄바꿈/잘림 규칙으로 제어하고(`line-clamp`, `break-keep`), 굵기로 해결하지 않는다.
- 동일 컴포넌트 내에서 뷰포트별 텍스트 의미가 달라지지 않도록(예: 모바일/데스크톱 다른 문구 강조) weight 차이를 최소화한다.

### 3.5 적용/리뷰 체크리스트
- [ ] 이 요소가 1차 내비/핵심 CTA보다 더 굵거나 크지 않은가?
- [ ] 활성 상태 강조가 “기본 대비 1단계”를 넘지 않는가?
- [ ] 모바일에서 텍스트 과밀(두꺼운 폰트 + 큰 크기 + 높은 채도)이 발생하지 않는가?
- [ ] `font-black` 사용이 브랜드/히어로 특수 케이스인가?

### 3.6 1차 적용 기준값 (Campaign List + Admin Campaigns)
- **캠페인 목록 필터 바:** 기본 `font-medium`, 활성 상태만 `font-semibold`~`font-bold`
- **캠페인 목록 검색/정렬/상세설정:** `font-medium`~`font-semibold` 유지 (`font-black` 금지)
- **관리자 캠페인 테이블:** 제목/핵심 수치 `font-bold`, 메타/보조 라벨 `font-medium`~`font-semibold`
- **상시모집/상태 보조 뱃지:** 애니메이션(`animate-pulse`) 기본 금지, 색/테두리로만 강조

### 3.7 한글 다단(Multi-line) 헤드라인 줄바꿈 규칙 (Typography Wrapping Rule)
한글 텍스트(특히 랜딩 페이지의 제목/헤드라인)가 브라우저 폭에 의해 줄바꿈될 때, 단어의 중간이 뚝 끊어지거나 어색하게 나누어지는 현상("체험단입 / 니다")을 강경하게 방어합니다. 모바일 가독성 및 UI 완성도를 지키기 위해 다음 규칙을 필수로 적용합니다.

1. **`break-keep` (word-break: keep-all) 필수 적용**
   - 긴 멘트나 다단 타이틀 텍스트가 들어가는 컴포넌트(`h1`, `h2`, `p` 등)에는 반드시 Tailwind CSS의 `break-keep` 클래스를 추가합니다.
   - 글자 단위로 끊어지는 것을 막아주고 띄어쓰기(어절) 기준으로만 줄바꿈을 허용하여 형태를 깔끔하게 다듬어 줍니다.
2. **논리적 덩어리 보호 (`inline-block` 또는 `whitespace-nowrap`)**
   - 두세 단어로 이루어져 있더라도 문맥상 절대로 분리해서 읽히면 안 되는 한 덩어리의 핵심 어구는 `<span className="inline-block">`으로 묶습니다.
   - 화면 폭이 좁아지면 해당 덩어리가 통째로 아랫줄로 넘어가므로, 한글의 의미적 가독성을 100% 지켜내는 최고의 디테일 규칙입니다.
3. **안내 문구 길이 제한**
   - 도움말과 안내 박스 문구는 먼저 한 문장으로 축약하고 `break-keep`을 적용한다.
   - 좁은 화면에서 불가피하게 두 줄이 되더라도 조사나 어미가 글자 단위로 분리되지 않게 한다.


### 3.8 확정 기준: 굵기·글자 크기·버튼 (2026-11-26, 3.2·3.3보다 우선)
널리 쓰는 기준(Apple 최소 터치 44pt·최소 글자 11pt, Material 버튼 40dp·버튼 글자 14/500, 토스 본문 15·보조 13·캡션 11, shadcn 버튼 36)을 참고해 정했다.

**굵기 4가지만 사용**
| 굵기 | 클래스 | 쓰는 곳 |
|---|---|---|
| 400 | `font-normal` | 본문, 설명 |
| 500 | `font-medium` | 라벨, 캡션, 표 안 글 |
| 600 | `font-semibold` | 버튼, 카드 제목, 강조 |
| 700 | `font-bold` | 페이지·섹션 제목, 큰 숫자 |
- 800·900 금지. `tailwind.config.ts`에서 `font-extrabold`·`font-black`을 700으로 매핑해 두었다(새 코드에는 `font-bold`를 쓴다). 예외: 로고 글자(`.brand-text-base`).

**글자 크기 7단계만 사용**
| 단계 | 크기 | 클래스 | 굵기 |
|---|---|---|---|
| 페이지 제목 | 20 / 24px | `text-xl sm:text-2xl` | 700 |
| 섹션·모달 제목 | 18px | `text-lg` | 700 |
| 카드 제목 | 16px | `text-base` | 600 |
| 본문 | 14px | `text-sm` | 400 |
| 보조 | 13px | `text-body-sm` | 400 |
| 캡션 | 12px | `text-xs` | 500 |
| 최소 | 11px | `text-2xs` | 500 |
- 버튼 전용 15px는 `text-cta`(공통 `Button` lg·bottom 안에서만).
- `text-[숫자px]` 임의 크기와 11px 미만 글자 금지(2단계에서 기존 사용처 정리).

**버튼은 공통 `Button`(`src/components/ui/button.tsx`)의 크기만 사용**
| size | 높이 | 글자 | 쓰는 곳 |
|---|---|---|---|
| `sm` | 32px | 13px 500 | 표 안 동작 |
| `default` | 40px | 14px 600 | 일반 버튼, 모달 보조 버튼 |
| `lg` | 44px | 15px 600 | 화면의 주요 동작 1개(등록 완료·제출 등) |
| `bottom` | 48px | 15px 700 | 모바일 화면 맨 아래 고정 버튼만 |
- 모서리 8px(`rounded-btn`) 통일. 버튼에 색 그림자(`shadow-rose-*` 등) 금지.
- 화면에서 `h-*`·`py-*`·`text-*`·`font-black`으로 버튼 높이·글자를 덮어쓰지 않는다(너비·배치 클래스만 허용).
