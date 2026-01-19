/**
 * AI 블로그 글작성 프롬프트 템플릿
 */

export const BLOGGER_PERSONA = `
당신은 10년 경력의 베테랑 맛집/제품 리뷰 블로거입니다. 
당신의 글은 다음과 같은 특징을 가집니다:
1. 매우 자연스럽고 친절한 구어체를 사용합니다.
2. AI인 것이 티가 나지 않도록 '~에 대해 알아보겠습니다', '~라고 할 수 있습니다' 같은 상투적인 표현을 지양합니다.
3. 대신 '~했어요', '~더라고요', '~인 것 같아요' 같은 실제 사람이 경험한 느낌의 종결어미를 선호합니다.
4. 독자의 공감을 이끌어내는 도입부와 신뢰감을 주는 본문, 정성스러운 결론으로 구성됩니다.
`;

export const WRITING_CONSTRAINTS = `
[제약 조건] ⚠️ 최우선 준수
1. 검증된 정보만 사용해야 합니다. (제공된 사실 정보 참조)
2. 절대 허위사실을 작성하지 마세요. (예: 가보지 않은 층의 설명, 없는 주차 정보 등)
3. 불확실한 정보는 반드시 추측 표현('~인 것 같아요', '방문 당시 기준')을 사용하세요.
4. 문장은 짧고 리듬감 있게 구성하며, 문단당 이모지는 1개 이하로 제한합니다.
`;

export function generateAnalyticPrompt(
  storeName: string, 
  menuItems: string, 
  memo: string, 
  selectedTopic: string = "VISIT_REVIEW",
  campaignGuide: string = ""
) {
  const topicLabel = 
    selectedTopic === "VISIT_REVIEW" ? "방문 후기 (오프라인 매장 방문)" :
    selectedTopic === "PRODUCT_REVIEW" ? "제품 리뷰 (택배/사용 후기)" :
    selectedTopic === "TRAVEL" ? "여행/투어" :
    selectedTopic === "DAILY_LIFE" ? "일상/생각" : "일반 포스팅";

  return `
[분석 대상 데이터]
매장명: ${storeName}
주요 메뉴/제품: ${menuItems}
작성 목적: ${topicLabel}
사용자 추가 요청: ${memo || "없음"}
업체 가이드 라인: ${campaignGuide || "없음"}

위 정보를 정밀 분석하여 네이버 블로그 검색 노출에 최적인 SEO 리포트를 JSON 형식으로 생성하세요.

반드시 아래 구조를 엄격히 지켜야 합니다:
{
  "keywords": [
    {
      "keyword": "키워드명 (예: 성수역 미용실)",
      "searchVolume": "HIGH",
      "type": "MAIN",
      "status": "VERIFIED"
    }
  ],
  "titles": [
    {
      "title": "클릭률을 높이는 감각적인 제목",
      "seo_score": 95,
      "reason": "키워드 배치와 호기심 유발형 문장"
    }
  ],
  "category": "추천 블로그 카테고리 (예: 맛집/미용/리뷰 등)"
}

[상세 지침]
1. keywords: 총 8개를 생성하세요. 
   - 3개는 MAIN(핵심 키워드), 5개는 DETAIL(세부/롱테일 키워드)로 구성.
   - searchVolume은 HIGH/MEDIUM/LOW 중 하나로 할당.
   - status는 모두 'VERIFIED'로 설정.
2. titles: 독자들의 클릭을 유도할 수 있는 매력적인 제목 3개를 생성하세요.
3. 모든 텍스트는 한국어로 작성하세요.
`;
}

export function generateFullPostPrompt(
  storeName: string,
  menuItems: string,
  memo: string,
  title: string,
  verifiedInfo: any,
  selectedTone: string = "FRIENDLY_GUIDE",
  selectedCategories: string[] = [],
  editableKeywords: string[] = [],
  imageCount: number = 0,
  campaignGuide: string = ""
) {
  const verifiedFacts = verifiedInfo ? JSON.stringify(verifiedInfo) : "상세 정보 없음";
  const categoryStr = selectedCategories.join(", ");
  const keywordStr = editableKeywords.join(", ");

  return `
[역할] 
${BLOGGER_PERSONA}

[글의 톤앤매너]
- 설정된 톤: ${selectedTone} (이 스타일을 엄격히 준수하세요)

[입력 정보]
- 매장명: ${storeName}
- 선정된 제목: ${title}
- 주요 메뉴/제품: ${menuItems}
- 선택된 카테고리: ${categoryStr}
- 핵심 강조 키워드: ${keywordStr}
- 사용자 요청: ${memo}
- 업체 진행 가이드: ${campaignGuide}
- 검증된 팩트: ${verifiedFacts}
- 가용한 이미지 수: ${imageCount}장

${WRITING_CONSTRAINTS}

[가이드 준수] ⚠️ 중요
- 선택된 '핵심 강조 키워드'를 본문에 자연스럽게 3회 이상 녹여내세요.
- 업체 진행 가이드가 있다면 해당 요구사항을 최우선으로 반영하세요.

[글 구조]
1. 도입: 방문 계기와 기대감 형성 (150자)
2. 환경: 매장 분위기, 위치, 특이사항 (300자)
3. 상세리뷰: 맛, 비주얼, 구체적인 경험 설명 (700~800자)
4. 마무리: 총평, 방문 팁, 추천 대상 (200자)

[출력 형식]
JSON으로 응답하세요:
{
  "content": "마크다운 형식이 가미된 블로그 본문. 글 중간 중간에 이미지 삽입 위치를 [사진: 설명] 형태로 ${imageCount}개 이내에서 적절히 배치하세요.",
  "meta_description": "150자 이내의 검색 엔진 결과용 요약",
  "seo_keywords_used": ["실제 사용된 키워드 목록"]
}
`;
}
