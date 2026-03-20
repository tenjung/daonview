import { LandingPageInput } from '@/types/landingPage';

export const generateInfluencerPrompt = (input: LandingPageInput): string => {
  return `
당신은 인플루언서 마케팅 전문가입니다.
다음 정보를 바탕으로 광고주가 협업하고 싶어질 매력적인 랜딩페이지를 설계하세요.

[입력 정보]
- 이름/채널명: ${input.name || '미입력'}
- 플랫폼: ${input.platform || '미입력'}
- 팔로워 수: ${input.followers || '미입력'}
- 카테고리: ${input.category || '미입력'}
- 강점: ${input.strength || '미입력'}
- 연락처: ${input.email || input.instagram || input.phone || '미입력'}

[설계 원칙]
1. 헤드라인은 ROI와 신뢰성을 강조해야 합니다.
2. 통계는 구체적인 숫자로 표현하세요 (예: "50K+" 형식).
3. 포트폴리오는 3개의 대표 협업 사례를 만들어주세요.
4. 색상은 다온뷰 브랜드 컬러(#EB0270)를 primary로 사용하세요.
5. 이미지 키워드는 영문으로 작성하세요.

[출력 형식 - 반드시 유효한 JSON만 반환]
{
  "hero": {
    "headline": "강력한 헤드라인 (ROI 강조, 한국어)",
    "subheadline": "부제목 (신뢰성 강조, 한국어)",
    "cta": "CTA 버튼 텍스트 (한국어)"
  },
  "stats": [
    { "label": "팔로워", "value": "10K+", "icon": "users" },
    { "label": "평균 조회수", "value": "50K+", "icon": "eye" },
    { "label": "협업 브랜드", "value": "20+", "icon": "briefcase" }
  ],
  "portfolio": [
    {
      "title": "협업 사례 제목 (한국어)",
      "description": "협업 내용 설명 (한국어)",
      "result": "성과 (예: 조회수 100만+, 한국어)",
      "imageKeyword": "영문 이미지 키워드"
    }
  ],
  "contact": {
    "email": "${input.email || ''}",
    "instagram": "${input.instagram || ''}",
    "blog": "${input.blog || ''}",
    "phone": "${input.phone || ''}"
  },
  "colorScheme": {
    "primary": "#EB0270",
    "secondary": "#8B5CF6"
  },
  "imageKeywords": ["professional workspace", "content creator", "social media"]
}

중요: 반드시 유효한 JSON 형식으로만 응답하세요. 설명이나 주석을 추가하지 마세요.
`;
};

export const generateBusinessPrompt = (input: LandingPageInput): string => {
  return `
당신은 스타트업 마케팅 전문가입니다.
다음 사업 아이템으로 투자자/고객을 설득할 랜딩페이지를 설계하세요.

[입력 정보]
- 사업명: ${input.businessName || '미입력'}
- 한 줄 설명: ${input.description || '미입력'}
- 타겟 고객: ${input.targetCustomer || '미입력'}
- 핵심 가치: ${input.coreValue || '미입력'}
- 제공 서비스: ${input.services || '미입력'}
- 연락처: ${input.email || input.phone || '미입력'}

[설계 원칙]
1. 헤드라인은 문제 해결과 가치 제안을 명확히 해야 합니다.
2. 통계는 시장 규모, 고객 수, 성장률 등을 표현하세요.
3. 포트폴리오는 3개의 핵심 기능/서비스로 구성하세요.
4. 색상은 다온뷰 브랜드 컬러(#EB0270)를 primary로 사용하세요.
5. 이미지 키워드는 영문으로 작성하세요.

[출력 형식 - 반드시 유효한 JSON만 반환]
{
  "hero": {
    "headline": "강력한 헤드라인 (문제 해결 강조, 한국어)",
    "subheadline": "부제목 (가치 제안, 한국어)",
    "cta": "CTA 버튼 텍스트 (한국어)"
  },
  "stats": [
    { "label": "타겟 시장", "value": "1M+", "icon": "target" },
    { "label": "고객 만족도", "value": "98%", "icon": "heart" },
    { "label": "성장률", "value": "300%", "icon": "trending-up" }
  ],
  "portfolio": [
    {
      "title": "핵심 기능/서비스 제목 (한국어)",
      "description": "기능 설명 (한국어)",
      "result": "기대 효과 (한국어)",
      "imageKeyword": "영문 이미지 키워드"
    }
  ],
  "contact": {
    "email": "${input.email || ''}",
    "phone": "${input.phone || ''}",
    "instagram": "${input.instagram || ''}",
    "blog": "${input.blog || ''}"
  },
  "colorScheme": {
    "primary": "#EB0270",
    "secondary": "#8B5CF6"
  },
  "imageKeywords": ["modern business", "startup office", "innovation"]
}

중요: 반드시 유효한 JSON 형식으로만 응답하세요. 설명이나 주석을 추가하지 마세요.
`;
};
