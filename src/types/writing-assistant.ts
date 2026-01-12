// AI 글작성 도우미 관련 타입 정의

export type ToneType = "친근한" | "전문적인" | "유머러스한" | "감성적인";

export interface WritingAssistantRequest {
  storeName: string;
  menuItems: string;
  memo?: string;
  tone: ToneType;
  platform?: "NAVER" | "TISTORY" | "GENERAL";
}

export interface RecommendedKeyword {
  keyword: string;
  searchVolume: "HIGH" | "MEDIUM" | "LOW";
  type: "MAIN" | "DETAIL";
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
