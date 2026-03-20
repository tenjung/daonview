# 🤖 AI-Ready Data Convention & Logic Rules

이 문서는 AI 에이전트와 개발자가 프론트엔드 및 데이터베이스 간의 데이터 무결성을 유지하기 위해 준수해야 할 **절대 규칙**입니다.

---

## �️ 1. 데이터 표현 기본 규칙 (Standard Format)

1.  **데이터베이스 저장 값 (Database Standard)**:
    *   모든 상태(Status), 유형(Type), 플랫폼(Platform) 상수는 **`UPPERCASE_STRING`** (영문 대문자 및 언더바) 형식을 사용한다.
    *   예: `RECRUITING` (O), `Recruiting` (X), `recruit` (X)

2.  **프론트엔드 코드 내 비교 (Code Logic)**:
    *   DB에서 가져온 값을 비교하거나 필터링할 때는 반드시 **대문자**를 기준으로 한다.
    *   안전성을 위해 비교 전 `.toUpperCase()` 변환을 권장한다.
    *   예: `if (campaign.type === 'VISIT')`

3.  **UI 표시 (Display Mapping)**:
    *   사용자에게 보여지는 한글 명칭은 DB에 직접 저장하지 않으며, 프론트엔드의 Badge나 Label 컴포넌트에서 매핑하여 표시한다.

---

## � 2. 데이터 매핑 로직 패턴 (Mapping Pattern)

### A. 레거시 데이터 대응 (Legacy Data Handling)
*   프로젝트 개발 과정에서 데이터 규격이 변경될 수 있으므로, 데이터를 로드할 때 반드시 **Normalizer** 과정을 거친다.
*   **패턴**: `DB 값 ➔ (변환/매핑) ➔ 프론트엔드 State`
*   예시 (Normalizing Logic):
    ```typescript
    const normalizedType = campaign.type?.toUpperCase() || 'VISIT';
    const normalizedPlatform = campaign.platform?.toUpperCase() === '블로그' ? 'BLOG' : campaign.platform?.toUpperCase();
    ```

### B. 데이터 저장 시 (Saving Data)
*   폼에서 입력받은 데이터는 서버로 전송하기 직전에 DB 표준 규격(대문자)으로 최종 변환한다.
*   **패턴**: `Input Value ➔ (Validation) ➔ Uppercase Constant ➔ DB Insert/Update`

---

## ⚠️ 3. AI 에이전트 필수 준수 사항 (AI Enforcement)

1.  **신규 필드 추가 시**: 새로운 상태값이나 유형값이 추가될 경우, 소문자나 한글이 DB 컬럼에 직접 들어가지 않도록 설계를 검토한다.
2.  **수정 작업 시**: 특정 파일의 상수를 변경할 경우, 해당 상수를 사용하는 모든 파일(컴포넌트, API 로직, 타입 정의)을 스캔하여 일괄 수정한다.
3.  **무결성 체크**: 프론트엔드에서 상수를 변경했는데 DB 제약 조건(Check Constraint)과 충돌할 가능성이 있다면 사용자에게 SQL 수정을 함께 제안한다.

