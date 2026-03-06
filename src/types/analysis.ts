// 블로그 분석 관련 타입 정의

export interface BlogAnalysisRequest {
  url: string;
}

export interface Keyword {
  word: string;
  count: number;
  score?: number; // TF-IDF 점수
}

export interface ExposureData {
  keyword: string;
  monthlySearchVolume: number;
  competition: 'HIGH' | 'MEDIUM' | 'LOW';
  trend?: 'RISING' | 'STABLE' | 'FALLING';
}

export interface BlogAnalysisResult {
  title: string;
  content: string;
  stats: {
    wordCount: number;
    imageCount: number;
    keywordDensity: number;
  };
  keywords: {
    primary: Keyword[];
    secondary: Keyword[];
  };
  exposure: ExposureData[];
  seoAdvice?: string;
}

export type AnalysisStatus = 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'ERROR';
