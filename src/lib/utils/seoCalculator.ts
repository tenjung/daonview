/**
 * 블로그 포스팅의 SEO 점수를 계산합니다.
 */
export function calculateSEOScore(content: string, title: string, keywords: string[]) {
  let score = 0;
  const issues: string[] = [];
  const wellDone: string[] = [];

  // 1. 글자 수 체크 (권장 1,500 ~ 2,500자)
  const length = content.length;
  if (length >= 1500) {
    score += 30;
    wellDone.push("글자 수가 1,500자 이상으로 풍부합니다.");
  } else if (length >= 800) {
    score += 15;
    issues.push("글자 수가 조금 부족합니다. 1,500자 이상을 권장합니다.");
  } else {
    issues.push("글자 수가 너무 짧습니다. 충분한 정보를 추가하세요.");
  }

  // 2. 제목 내 주요 키워드 포함여부
  const hasKeywordInTitle = keywords.some(k => title.includes(k));
  if (hasKeywordInTitle) {
    score += 20;
    wellDone.push("제목에 핵심 키워드가 잘 포함되었습니다.");
  } else {
    issues.push("제목에 메인 키워드를 포함하면 검색 노출에 유리합니다.");
  }

  // 3. 키워드 밀도 (본문 내 키워드 반복 횟수)
  let totalKeywordCount = 0;
  keywords.forEach(k => {
    const count = (content.match(new RegExp(k, 'g')) || []).length;
    totalKeywordCount += count;
  });

  if (totalKeywordCount >= 5 && totalKeywordCount <= 15) {
    score += 20;
    wellDone.push("키워드 빈도가 적절하게 배치되었습니다.");
  } else if (totalKeywordCount > 15) {
    score += 10;
    issues.push("키워드가 너무 자주 반복됩니다. 스팸으로 분류될 수 있으니 주의하세요.");
  } else {
    issues.push("핵심 키워드를 본문 내에 조금 더 자연스럽게 사용하세요.");
  }

  // 4. 이미지 배치 (이미지 플레이스홀더 수)
  const imageCount = (content.match(/\[사진:/g) || []).length;
  if (imageCount >= 3) {
    score += 20;
    wellDone.push("이미지가 충분히 배치되어 가독성이 좋습니다.");
  } else {
    score += 10;
    issues.push("이미지를 3개 이상 배치하면 체류 시간 증대에 도움이 됩니다.");
  }

  // 5. 제목 구조 (H1, H2 등)
  if (content.includes('## ')) {
    score += 10;
    wellDone.push("소제목을 사용하여 가독성을 높였습니다.");
  } else {
    issues.push("소제목(##)을 사용하여 내용을 구분해 보세요.");
  }

  return {
    totalScore: Math.min(score, 100),
    issues,
    wellDone
  };
}
