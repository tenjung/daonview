# Daonview UI/UX Design Rules

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

### 3.1 기본 폰트 패밀리 (Current Source of Truth)
- **기본 UI/본문 폰트:** `Pretendard`
  - 현재 전역 기준: `src/app/globals.css`의 `body { font-family: 'Pretendard', ... }`
- **모노 폰트:** `Geist Mono`
  - 코드/ID/트래킹번호/숫자 정렬이 중요한 영역에 사용
- 참고: `src/app/layout.tsx`에서 `Geist` 변수도 로드되지만, 기본 본문은 Pretendard 기준으로 운영한다.

### 3.2 텍스트 역할별 Weight 규칙
- **Page Title / Section Title:** `font-bold` (기본 700)
- **Global Navigation (1차):** `font-medium` 기본, 활성 상태 `font-semibold` 또는 `font-bold`
- **Filter / Tab (2차 조작 UI):** 기본 `font-medium`, 활성 상태만 `font-semibold`~`font-bold`
- **Body / Description:** 기본(400) 또는 `font-medium`
- **Badge / Label / Meta:** `font-semibold` (필요 시 `text-xs` 조합)
- **금지 규칙:** `font-black` 남용 금지 (브랜드 로고/히어로 타이틀 등 특수 영역만 예외)

### 3.3 크기 스케일 기본 가이드
- **본문:** `text-sm` ~ `text-base`
- **보조 텍스트/메타:** `text-xs` ~ `text-sm`
- **섹션 제목:** `text-lg` ~ `text-2xl`
- **페이지 메인 타이틀:** `text-2xl` ~ `text-4xl`
- 모바일에서는 크기 확대보다 `line-height`, `spacing`, `color contrast`로 위계를 우선 확보한다.

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
