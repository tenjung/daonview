// AI 글작성 도우미 관련 타입 정의

// 톤앤매너 타입 (STEP-2에서 선택)
export type ToneType = 
  | "FRIENDLY_GUIDE"      // 친절한 안내자
  | "EXPERT_CONCISE"      // 전문가의 간결체
  | "CONVERSATIONAL"      // 대화체 친근감
  | "HUMOROUS"            // 유머러스/재치
  | "EMOTIONAL_STORY";    // 감성/스토리

// 주제 타입 (STEP-1에서 선택)
export type TopicType = 
  | "VISIT_REVIEW"        // 배경공 (방문 후기)
  | "PRODUCT_REVIEW"      // 제품공 (제품 리뷰)
  | "TRAVEL"              // 여행
  | "DAILY_LIFE"          // 일상
  | "TUTORIAL"            // 튜토리얼
  | "INFORMATION";        // 정보성

// 글의 카테고리/의도 (STEP-2에서 복수 선택 가능)
export type ContentCategory =
  | "정보성"
  | "방문후기/체험기"
  | "제품 리뷰/분석"
  | "튜토리얼"
  | "비교/리뷰"
  | "문제 해결 가이드"
  | "교육/설명"
  | "보행/여행기"
  | "일상/스토리"
  | "실용/라이프"
  | "공급/홍보"
  | "스타일/패션"
  | "인터뷰/대담"
  | "엔터테인먼트/비디오"
  | "IT/컴퓨터"
  | "교육/학습"
  | "라이프/실용";

export interface WritingAssistantRequest {
  storeName: string;
  menuItems: string;
  memo?: string;
  selectedTopic?: TopicType;
  tone: ToneType;
  platform?: "NAVER" | "TISTORY" | "GENERAL";
}

// 키워드 색상 코딩 타입
export type KeywordStatus = 
  | "INSUFFICIENT_INFO"   // 정보부족 (빨강)
  | "INSUFFICIENT_LUCK"   // 불충분한덕 (주황)
  | "PENDING"             // 미정 (회색)
  | "UNKNOWN"             // 알수없음 (보라)
  | "VERIFIED";           // 검증됨 (초록)

export interface RecommendedKeyword {
  keyword: string;
  searchVolume: "HIGH" | "MEDIUM" | "LOW";
  type: "MAIN" | "DETAIL";
  status?: KeywordStatus; // 키워드 상태 (색상 코딩용)
}

export interface RecommendedTitle {
  title: string;
  seo_score: number;
  reason: string;
}

export interface VerifiedInfo {
  name?: string;
  address?: string;
  hours?: string;
  phone?: string;
  rating?: number;
  category?: string;
  isVerified: boolean;
}

export interface WritingAssistantResult {
  content: string;
  seo_keywords_used: string[];
  meta_description: string;
  image_positions: { imageIndex: number; afterParagraph: number }[];
  verified_facts?: VerifiedInfo;
}

export interface WritingAssistantStage {
  current: number; // 0=Input, 1=Analyzing, 2=Review, 3=Generating, 4=Result
}
